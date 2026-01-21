/**
 * Telemetry wrapper for iOS platform
 *
 * Provides:
 * - Wide event logging (canonical log lines per loggingsucks.com)
 * - PostHog event capture with canonical properties
 * - OTel trace context propagation (when OTel iOS SDK is added)
 * - Tail-sampling for cost control
 *
 * Wide Event Pattern:
 * - One comprehensive event per request/action per service
 * - Include all context needed for debugging
 * - Tail-sampling: always keep errors/slow, sample healthy traffic
 */

import Foundation
import os.log

// MARK: - Configuration

/// Telemetry configuration from environment/build settings
public enum TelemetryConfig {
    /// PostHog API key (from build settings or Info.plist)
    public static var posthogKey: String? {
        Bundle.main.infoDictionary?["POSTHOG_API_KEY"] as? String
    }
    
    /// PostHog host URL
    public static var posthogHost: String {
        (Bundle.main.infoDictionary?["POSTHOG_HOST"] as? String) ?? "https://eu.i.posthog.com"
    }
    
    /// Honeycomb API key (for future OTel integration)
    public static var honeycombKey: String? {
        Bundle.main.infoDictionary?["HONEYCOMB_API_KEY"] as? String
    }
    
    /// Current environment
    public static var environment: String {
        #if DEBUG
        return "development"
        #else
        return "production"
        #endif
    }
    
    /// App version
    public static var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0.0"
    }
    
    /// Build number
    public static var buildNumber: String {
        Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "0"
    }
    
    /// Sample rate for healthy events (5%)
    public static let healthySampleRate: Double = 0.05
    
    /// Threshold for slow operations (2s)
    public static let slowOperationThresholdMs: Double = 2000
}

// MARK: - Event Types

/// Canonical event names per observability schema
public enum TelemetryEvent: String, Codable {
    case appOpened = "app_opened"
    case authSignedIn = "auth_signed_in"
    case authSignedOut = "auth_signed_out"
    case challengeCreated = "challenge_created"
    case challengeUpdated = "challenge_updated"
    case challengeArchived = "challenge_archived"
    case entryCreated = "entry_created"
    case entryUpdated = "entry_updated"
    case entryDeleted = "entry_deleted"
    case dataExportStarted = "data_export_started"
    case dataExportCompleted = "data_export_completed"
    case dataImportStarted = "data_import_started"
    case dataImportCompleted = "data_import_completed"
    case apiRequest = "api_request"
}

/// Outcome of an operation
public enum TelemetryOutcome: String, Codable {
    case success
    case error
}

// MARK: - Property Types

/// Common properties included on every event
public struct CommonProperties: Codable {
    public let platform: String = "ios"
    public let env: String
    public let appVersion: String
    public let buildNumber: String
    public var userId: String?
    public var isSignedIn: Bool
    public var sessionId: String?
    public var traceId: String?
    public var spanId: String?
    public var requestId: String?
    
    public init(userId: String? = nil, sessionId: String? = nil, requestId: String? = nil) {
        self.env = TelemetryConfig.environment
        self.appVersion = TelemetryConfig.appVersion
        self.buildNumber = TelemetryConfig.buildNumber
        self.userId = userId
        self.isSignedIn = userId != nil
        self.sessionId = sessionId
        self.requestId = requestId
    }
    
    private enum CodingKeys: String, CodingKey {
        case platform, env
        case appVersion = "app_version"
        case buildNumber = "build_number"
        case userId = "user_id"
        case isSignedIn = "is_signed_in"
        case sessionId = "session_id"
        case traceId = "trace_id"
        case spanId = "span_id"
        case requestId = "request_id"
    }
}

/// Domain-specific properties
public struct DomainProperties: Codable {
    public var challengeId: String?
    public var timeframeUnit: String?
    public var targetNumber: Int?
    public var entryId: String?
    public var entryCount: Int?
    public var hasNote: Bool?
    public var hasSets: Bool?
    public var feeling: String?
    
    public init(
        challengeId: String? = nil,
        timeframeUnit: String? = nil,
        targetNumber: Int? = nil,
        entryId: String? = nil,
        entryCount: Int? = nil,
        hasNote: Bool? = nil,
        hasSets: Bool? = nil,
        feeling: String? = nil
    ) {
        self.challengeId = challengeId
        self.timeframeUnit = timeframeUnit
        self.targetNumber = targetNumber
        self.entryId = entryId
        self.entryCount = entryCount
        self.hasNote = hasNote
        self.hasSets = hasSets
        self.feeling = feeling
    }
    
    private enum CodingKeys: String, CodingKey {
        case challengeId = "challenge_id"
        case timeframeUnit = "timeframe_unit"
        case targetNumber = "target_number"
        case entryId = "entry_id"
        case entryCount = "entry_count"
        case hasNote = "has_note"
        case hasSets = "has_sets"
        case feeling
    }
}

/// Request-specific properties
public struct RequestProperties: Codable {
    public var method: String?
    public var path: String?
    public var statusCode: Int?
    public var durationMs: Double?
    public var outcome: TelemetryOutcome?
    public var errorType: String?
    public var errorCode: String?
    public var errorMessage: String?
    public var errorRetriable: Bool?
    
    public init() {}
    
    private enum CodingKeys: String, CodingKey {
        case method, path, outcome
        case statusCode = "status_code"
        case durationMs = "duration_ms"
        case errorType = "error_type"
        case errorCode = "error_code"
        case errorMessage = "error_message"
        case errorRetriable = "error_retriable"
    }
}

// MARK: - Wide Event

/// Wide event envelope for structured logging
public struct WideEvent: Codable {
    public let type: String = "wide_event"
    public let event: TelemetryEvent
    public let timestamp: String
    public let common: CommonProperties
    public let domain: DomainProperties?
    public let request: RequestProperties?
    
    public init(
        event: TelemetryEvent,
        common: CommonProperties,
        domain: DomainProperties? = nil,
        request: RequestProperties? = nil
    ) {
        self.event = event
        self.timestamp = ISO8601DateFormatter().string(from: Date())
        self.common = common
        self.domain = domain
        self.request = request
    }
    
    /// Flattened dictionary for PostHog properties
    public var flattenedProperties: [String: Any] {
        var props: [String: Any] = [
            "type": type,
            "event": event.rawValue,
            "timestamp": timestamp,
            "platform": common.platform,
            "env": common.env,
            "app_version": common.appVersion,
            "build_number": common.buildNumber,
            "is_signed_in": common.isSignedIn
        ]
        
        if let userId = common.userId { props["user_id"] = userId }
        if let sessionId = common.sessionId { props["session_id"] = sessionId }
        if let traceId = common.traceId { props["trace_id"] = traceId }
        if let spanId = common.spanId { props["span_id"] = spanId }
        if let requestId = common.requestId { props["request_id"] = requestId }
        
        // Domain properties
        if let d = domain {
            if let v = d.challengeId { props["challenge_id"] = v }
            if let v = d.timeframeUnit { props["timeframe_unit"] = v }
            if let v = d.targetNumber { props["target_number"] = v }
            if let v = d.entryId { props["entry_id"] = v }
            if let v = d.entryCount { props["entry_count"] = v }
            if let v = d.hasNote { props["has_note"] = v }
            if let v = d.hasSets { props["has_sets"] = v }
            if let v = d.feeling { props["feeling"] = v }
        }
        
        // Request properties
        if let r = request {
            if let v = r.method { props["method"] = v }
            if let v = r.path { props["path"] = v }
            if let v = r.statusCode { props["status_code"] = v }
            if let v = r.durationMs { props["duration_ms"] = v }
            if let v = r.outcome { props["outcome"] = v.rawValue }
            if let v = r.errorType { props["error_type"] = v }
            if let v = r.errorCode { props["error_code"] = v }
            if let v = r.errorMessage { props["error_message"] = v }
            if let v = r.errorRetriable { props["error_retriable"] = v }
        }
        
        return props
    }
}

// MARK: - Telemetry Service

/// Main telemetry service for iOS
public final class Telemetry {
    public static let shared = Telemetry()
    
    private let logger = Logger(subsystem: "app.tally.ios", category: "telemetry")
    private let encoder = JSONEncoder()
    
    // PostHog client will be initialized when SDK is added
    // private var posthog: PHGPostHog?
    
    private init() {
        encoder.outputFormatting = [.sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        // Initialize PostHog when SDK is added
        // setupPostHog()
    }
    
    // MARK: - Sampling
    
    /// Tail-sampling decision: always keep errors/slow, sample healthy traffic
    public func shouldSample(_ event: WideEvent) -> Bool {
        // Always keep errors
        if let outcome = event.request?.outcome, outcome == .error {
            return true
        }
        if let statusCode = event.request?.statusCode, statusCode >= 400 {
            return true
        }
        if event.request?.errorType != nil {
            return true
        }
        
        // Always keep slow operations
        if let durationMs = event.request?.durationMs, durationMs > TelemetryConfig.slowOperationThresholdMs {
            return true
        }
        
        // Random sample healthy traffic
        return Double.random(in: 0...1) < TelemetryConfig.healthySampleRate
    }
    
    // MARK: - Logging
    
    /// Log a wide event (structured JSON to console + PostHog)
    public func logWideEvent(_ event: WideEvent) {
        guard shouldSample(event) else { return }
        
        // Structured JSON log
        if let jsonData = try? encoder.encode(event),
           let jsonString = String(data: jsonData, encoding: .utf8) {
            logger.info("\(jsonString)")
        }
        
        // PostHog capture (when SDK is added)
        // posthog?.capture(event.event.rawValue, properties: event.flattenedProperties)
    }
    
    /// Capture an event with minimal boilerplate
    public func capture(
        _ event: TelemetryEvent,
        userId: String? = nil,
        sessionId: String? = nil,
        domain: DomainProperties? = nil,
        request: RequestProperties? = nil
    ) {
        let common = CommonProperties(
            userId: userId,
            sessionId: sessionId,
            requestId: generateRequestId()
        )
        let wideEvent = WideEvent(event: event, common: common, domain: domain, request: request)
        logWideEvent(wideEvent)
    }
    
    // MARK: - Helpers
    
    /// Generate a unique request ID
    public func generateRequestId() -> String {
        let timestamp = Int(Date().timeIntervalSince1970 * 1000)
        let random = String(Int.random(in: 0..<1000000), radix: 36)
        return "req_\(timestamp)_\(random)"
    }
}

// MARK: - Wide Event Builder

/// Builder for accumulating context during an operation
public final class WideEventBuilder {
    private let event: TelemetryEvent
    private var userId: String?
    private var sessionId: String?
    private var domain = DomainProperties()
    private var request = RequestProperties()
    private let startTime: Date
    
    public init(_ event: TelemetryEvent, userId: String? = nil, sessionId: String? = nil) {
        self.event = event
        self.userId = userId
        self.sessionId = sessionId
        self.startTime = Date()
    }
    
    @discardableResult
    public func withUser(_ userId: String?, sessionId: String? = nil) -> Self {
        self.userId = userId
        self.sessionId = sessionId ?? self.sessionId
        return self
    }
    
    @discardableResult
    public func withChallenge(id: String, timeframe: String? = nil, target: Int? = nil) -> Self {
        domain.challengeId = id
        domain.timeframeUnit = timeframe
        domain.targetNumber = target
        return self
    }
    
    @discardableResult
    public func withEntry(id: String, count: Int? = nil, hasNote: Bool? = nil, feeling: String? = nil) -> Self {
        domain.entryId = id
        domain.entryCount = count
        domain.hasNote = hasNote
        domain.feeling = feeling
        return self
    }
    
    @discardableResult
    public func withRequest(method: String, path: String) -> Self {
        request.method = method
        request.path = path
        return self
    }
    
    @discardableResult
    public func success(statusCode: Int = 200) -> Self {
        request.statusCode = statusCode
        request.outcome = .success
        return self
    }
    
    @discardableResult
    public func error(_ error: Error, code: String? = nil, retriable: Bool = false, statusCode: Int = 500) -> Self {
        request.statusCode = statusCode
        request.outcome = .error
        request.errorType = String(describing: type(of: error))
        request.errorCode = code
        request.errorMessage = error.localizedDescription
        request.errorRetriable = retriable
        return self
    }
    
    /// Emit the wide event
    public func emit() {
        request.durationMs = Date().timeIntervalSince(startTime) * 1000
        
        let common = CommonProperties(
            userId: userId,
            sessionId: sessionId,
            requestId: Telemetry.shared.generateRequestId()
        )
        let wideEvent = WideEvent(event: event, common: common, domain: domain, request: request)
        Telemetry.shared.logWideEvent(wideEvent)
    }
}

// MARK: - Convenience Extensions

public extension Telemetry {
    /// Create a wide event builder for fluent API
    func event(_ type: TelemetryEvent, userId: String? = nil) -> WideEventBuilder {
        WideEventBuilder(type, userId: userId)
    }
    
    /// Quick capture for app lifecycle events
    func appOpened(userId: String? = nil) {
        capture(.appOpened, userId: userId)
    }
    
    func signedIn(userId: String) {
        capture(.authSignedIn, userId: userId)
    }
    
    func signedOut(userId: String? = nil) {
        capture(.authSignedOut, userId: userId)
    }
}
