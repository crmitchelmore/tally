import Foundation
import OpenTelemetryApi
import OpenTelemetrySdk

#if os(iOS)
import UIKit
#endif

/// Grafana Cloud instance ID for OTLP auth
private let grafanaCloudInstanceId = "1491410"

/// Simple OTLP JSON span exporter for Grafana Cloud
/// Uses JSON format over HTTP since we can't use the full OTLP protobuf exporter due to dependency conflicts
private final class GrafanaOtlpSpanExporter: SpanExporter {
  private let endpoint: URL
  private let authHeader: String
  private let session: URLSession
  
  init(endpoint: URL, authHeader: String) {
    self.endpoint = endpoint
    self.authHeader = authHeader
    
    let config = URLSessionConfiguration.default
    config.timeoutIntervalForRequest = 30
    self.session = URLSession(configuration: config)
  }
  
  func export(spans: [SpanData], explicitTimeout: TimeInterval?) -> SpanExporterResultCode {
    guard !spans.isEmpty else { return .success }
    
    // Build OTLP JSON payload
    let payload = buildOtlpPayload(spans: spans)
    
    guard let jsonData = try? JSONSerialization.data(withJSONObject: payload) else {
      return .failure
    }
    
    var request = URLRequest(url: endpoint)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Basic \(authHeader)", forHTTPHeaderField: "Authorization")
    request.httpBody = jsonData
    
    // Fire and forget for efficiency - don't block on response
    let task = session.dataTask(with: request) { data, response, error in
      if let error = error {
        print("[TallyTelemetry] Export error: \(error.localizedDescription)")
      } else if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode >= 400 {
        print("[TallyTelemetry] Export failed with status: \(httpResponse.statusCode)")
      }
    }
    task.resume()
    
    return .success
  }
  
  func flush(explicitTimeout: TimeInterval?) -> SpanExporterResultCode {
    return .success
  }
  
  func shutdown(explicitTimeout: TimeInterval?) {
    session.invalidateAndCancel()
  }
  
  private func buildOtlpPayload(spans: [SpanData]) -> [String: Any] {
    // Group spans by resource
    var resourceSpans: [[String: Any]] = []
    
    // For simplicity, treat all spans as having same resource
    let scopeSpans: [[String: Any]] = [
      [
        "scope": ["name": "tally-ios", "version": "1.0.0"],
        "spans": spans.map { spanToJson($0) }
      ]
    ]
    
    if let firstSpan = spans.first {
      resourceSpans.append([
        "resource": [
          "attributes": firstSpan.resource.attributes.map { attributeToJson(key: $0.key, value: $0.value) }
        ],
        "scopeSpans": scopeSpans
      ])
    }
    
    return ["resourceSpans": resourceSpans]
  }
  
  private func spanToJson(_ span: SpanData) -> [String: Any] {
    var json: [String: Any] = [
      "traceId": span.traceId.hexString,
      "spanId": span.spanId.hexString,
      "name": span.name,
      "kind": spanKindToInt(span.kind),
      "startTimeUnixNano": String(span.startTime.timeIntervalSince1970.nanoseconds),
      "endTimeUnixNano": String(span.endTime.timeIntervalSince1970.nanoseconds),
      "attributes": span.attributes.map { attributeToJson(key: $0.key, value: $0.value) },
      "status": statusToJson(span.status)
    ]
    
    if span.parentSpanId != nil && span.parentSpanId!.isValid {
      json["parentSpanId"] = span.parentSpanId!.hexString
    }
    
    return json
  }
  
  private func attributeToJson(key: String, value: AttributeValue) -> [String: Any] {
    switch value {
    case .string(let s):
      return ["key": key, "value": ["stringValue": s]]
    case .int(let i):
      return ["key": key, "value": ["intValue": String(i)]]
    case .double(let d):
      return ["key": key, "value": ["doubleValue": d]]
    case .bool(let b):
      return ["key": key, "value": ["boolValue": b]]
    default:
      return ["key": key, "value": ["stringValue": String(describing: value)]]
    }
  }
  
  private func spanKindToInt(_ kind: SpanKind) -> Int {
    switch kind {
    case .internal: return 1
    case .server: return 2
    case .client: return 3
    case .producer: return 4
    case .consumer: return 5
    @unknown default: return 0
    }
  }
  
  private func statusToJson(_ status: Status) -> [String: Any] {
    switch status {
    case .ok:
      return ["code": 1]
    case .error(let description):
      return ["code": 2, "message": description]
    case .unset:
      return ["code": 0]
    }
  }
}

extension TimeInterval {
  var nanoseconds: UInt64 {
    UInt64(self * 1_000_000_000)
  }
}

/// OpenTelemetry setup for exporting traces/metrics to Grafana Cloud
public final class TallyTelemetry: @unchecked Sendable {
  public static let shared = TallyTelemetry()
  
  private let lock = NSLock()
  private var _isInitialized = false
  private var isInitialized: Bool {
    get { lock.withLock { _isInitialized } }
    set { lock.withLock { _isInitialized = newValue } }
  }
  
  private init() {}
  
  /// Initialize OpenTelemetry with OTLP exporter to Grafana Cloud.
  /// - Parameters:
  ///   - endpoint: OTLP HTTP endpoint (e.g., "https://otlp-gateway-prod-gb-south-1.grafana.net/otlp")
  ///   - token: Raw Grafana Cloud OTLP token (will be combined with instance ID for Basic auth)
  ///   - environment: deployment environment (development/staging/production)
  ///   - version: app version for service.version attribute
  ///   - osVersion: OS version string (pass from MainActor context)
  public func initialize(
    endpoint: String,
    token: String,
    environment: String = "production",
    version: String? = nil,
    osVersion: String? = nil
  ) {
    guard !isInitialized else { return }
    guard !endpoint.isEmpty, !token.isEmpty else {
      print("[TallyTelemetry] Missing endpoint or token, skipping initialization")
      return
    }
    
    // Build Basic auth header: base64(instanceId:token)
    let credentials = "\(grafanaCloudInstanceId):\(token)"
    guard let credentialsData = credentials.data(using: .utf8) else {
      print("[TallyTelemetry] Failed to encode credentials")
      return
    }
    let authHeader = credentialsData.base64EncodedString()
    
    // Build resource attributes per Grafana Cloud semantic conventions
    var resourceAttrs: [String: AttributeValue] = [
      "service.name": .string("tally-ios"),
      "service.namespace": .string("tally"),
      "deployment.environment": .string(environment),
      "telemetry.sdk.language": .string("swift"),
    ]
    
    if let version = version {
      resourceAttrs["service.version"] = .string(version)
    }
    
    // Add device info
    #if os(iOS)
    resourceAttrs["os.type"] = .string("darwin")
    resourceAttrs["os.name"] = .string("iOS")
    if let osVersion = osVersion {
      resourceAttrs["os.version"] = .string(osVersion)
    }
    resourceAttrs["device.model.identifier"] = .string(deviceModel())
    #endif
    
    let resource = Resource(attributes: resourceAttrs)
    
    // Configure OTLP HTTP exporter with Grafana Cloud auth
    guard let endpointUrl = URL(string: endpoint)?.appendingPathComponent("v1/traces") else {
      print("[TallyTelemetry] Invalid endpoint URL: \(endpoint)")
      return
    }
    
    let exporter = GrafanaOtlpSpanExporter(endpoint: endpointUrl, authHeader: authHeader)
    
    // Build tracer provider with batch processor for efficient export
    let spanProcessor = BatchSpanProcessor(spanExporter: exporter)
    
    let tracerProvider = TracerProviderBuilder()
      .add(spanProcessor: spanProcessor)
      .with(resource: resource)
      .build()
    
    OpenTelemetry.registerTracerProvider(tracerProvider: tracerProvider)
    
    isInitialized = true
    print("[TallyTelemetry] Initialized with endpoint: \(endpoint)")
  }
  
  /// Get a tracer for creating spans
  public func tracer(name: String = "tally-ios") -> Tracer {
    nonisolated(unsafe) let provider = OpenTelemetry.instance.tracerProvider
    return provider.get(
      instrumentationName: name,
      instrumentationVersion: "1.0.0"
    )
  }
  
  /// Create a span for tracking an operation
  public func startSpan(name: String, kind: SpanKind = .internal) -> Span {
    tracer().spanBuilder(spanName: name)
      .setSpanKind(spanKind: kind)
      .startSpan()
  }
  
  /// Convenience wrapper to trace an async operation
  public func trace<T>(
    name: String,
    kind: SpanKind = .internal,
    attributes: [String: AttributeValue] = [:],
    operation: () async throws -> T
  ) async rethrows -> T {
    let span = tracer().spanBuilder(spanName: name)
      .setSpanKind(spanKind: kind)
      .startSpan()
    
    for (key, value) in attributes {
      span.setAttribute(key: key, value: value)
    }
    
    defer { span.end() }
    
    do {
      return try await operation()
    } catch {
      span.status = .error(description: error.localizedDescription)
      throw error
    }
  }
  
  // MARK: - Private
  
  private func deviceModel() -> String {
    var systemInfo = utsname()
    uname(&systemInfo)
    let machine = withUnsafePointer(to: &systemInfo.machine) {
      $0.withMemoryRebound(to: CChar.self, capacity: 1) {
        String(validatingCString: $0)
      }
    }
    return machine ?? "unknown"
  }
}
