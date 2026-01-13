import Foundation
import OpenTelemetryApi
import OpenTelemetrySdk
import OpenTelemetryProtocolExporterHTTP
import URLSessionInstrumentation
import ResourceExtension

/// Grafana Cloud instance ID for OTLP auth
private let grafanaCloudInstanceId = "1491410"

/// OpenTelemetry setup for exporting traces/metrics to Grafana Cloud
public final class TallyTelemetry {
  public static let shared = TallyTelemetry()
  
  private var isInitialized = false
  private var urlSessionInstrumentation: URLSessionInstrumentation?
  
  private init() {}
  
  /// Initialize OpenTelemetry with OTLP exporter to Grafana Cloud.
  /// - Parameters:
  ///   - endpoint: OTLP HTTP endpoint (e.g., "https://otlp-gateway-prod-gb-south-1.grafana.net/otlp")
  ///   - token: Raw Grafana Cloud OTLP token (will be combined with instance ID for Basic auth)
  ///   - environment: deployment environment (development/staging/production)
  ///   - version: app version for service.version attribute
  public func initialize(
    endpoint: String,
    token: String,
    environment: String = "production",
    version: String? = nil
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
    resourceAttrs["os.version"] = .string(UIDevice.current.systemVersion)
    resourceAttrs["device.model.identifier"] = .string(deviceModel())
    #endif
    
    let resource = Resource(attributes: resourceAttrs)
    
    // Configure OTLP HTTP exporter with Grafana Cloud auth
    guard let endpointUrl = URL(string: endpoint) else {
      print("[TallyTelemetry] Invalid endpoint URL: \(endpoint)")
      return
    }
    
    let headers: [(String, String)] = [
      ("Authorization", "Basic \(authHeader)")
    ]
    
    let otlpTraceExporter = OtlpHttpTraceExporter(
      endpoint: endpointUrl.appendingPathComponent("v1/traces"),
      config: OtlpConfiguration(headers: headers)
    )
    
    // Build tracer provider with batch processor for efficient export
    let spanProcessor = BatchSpanProcessor(spanExporter: otlpTraceExporter)
    
    let tracerProvider = TracerProviderBuilder()
      .add(spanProcessor: spanProcessor)
      .with(resource: resource)
      .build()
    
    OpenTelemetry.registerTracerProvider(tracerProvider: tracerProvider)
    
    // Set up URLSession auto-instrumentation
    setupURLSessionInstrumentation()
    
    isInitialized = true
    print("[TallyTelemetry] Initialized with endpoint: \(endpoint)")
  }
  
  /// Get a tracer for creating spans
  public func tracer(name: String = "tally-ios") -> Tracer {
    OpenTelemetry.instance.tracerProvider.get(
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
  
  private func setupURLSessionInstrumentation() {
    urlSessionInstrumentation = URLSessionInstrumentation(configuration: .init(
      shouldInstrument: { request in
        // Instrument all outbound requests except to OTLP endpoint
        guard let host = request.url?.host else { return true }
        return !host.contains("grafana.net")
      }
    ))
  }
  
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

#if os(iOS)
import UIKit
#endif
