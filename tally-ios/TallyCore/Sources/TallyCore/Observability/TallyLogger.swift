import Foundation
import Sentry
import os.log

/// Log level for structured logging
public enum LogLevel: String, Comparable {
  case debug = "debug"
  case info = "info"
  case warn = "warn"
  case error = "error"
  
  private var priority: Int {
    switch self {
    case .debug: return 0
    case .info: return 1
    case .warn: return 2
    case .error: return 3
    }
  }
  
  public static func < (lhs: LogLevel, rhs: LogLevel) -> Bool {
    lhs.priority < rhs.priority
  }
}

/// Context for structured log entries
public struct LogContext {
  // Correlation
  public var traceId: String?
  public var spanId: String?
  public var requestId: String?
  
  // User context (privacy: use hashed IDs only)
  public var userId: String?
  
  // Operation context
  public var operation: String?
  public var durationMs: Int?
  
  // Error context
  public var error: Error?
  
  // Custom attributes
  public var extras: [String: Any]
  
  public init(
    traceId: String? = nil,
    spanId: String? = nil,
    requestId: String? = nil,
    userId: String? = nil,
    operation: String? = nil,
    durationMs: Int? = nil,
    error: Error? = nil,
    extras: [String: Any] = [:]
  ) {
    self.traceId = traceId
    self.spanId = spanId
    self.requestId = requestId
    self.userId = userId
    self.operation = operation
    self.durationMs = durationMs
    self.error = error
    self.extras = extras
  }
}

/// Structured logger for iOS with Sentry integration
///
/// Provides wide-event / canonical log lines that include correlation IDs,
/// structured context, and integrate with Sentry for error tracking.
///
/// Usage:
/// ```swift
/// import TallyCore
///
/// // Simple log
/// TallyLogger.shared.info("User signed in", context: LogContext(userId: "u_abc123"))
///
/// // Wide event (canonical log line)
/// TallyLogger.shared.info("api.request.completed", context: LogContext(
///   operation: "createChallenge",
///   durationMs: 150,
///   userId: "u_abc123",
///   extras: ["statusCode": 200]
/// ))
///
/// // Error with context
/// TallyLogger.shared.error("Failed to create entry", context: LogContext(
///   error: err,
///   userId: "u_abc123",
///   extras: ["challengeId": "ch_xyz"]
/// ))
/// ```
public final class TallyLogger: @unchecked Sendable {
  public static let shared = TallyLogger()
  
  private let osLog = OSLog(subsystem: "app.tally", category: "general")
  private let lock = NSLock()
  
  private var _minLevel: LogLevel = .info
  private var minLevel: LogLevel {
    get { lock.withLock { _minLevel } }
    set { lock.withLock { _minLevel = newValue } }
  }
  
  private let service = "tally-ios"
  private let platform = "ios"
  
  private init() {
    #if DEBUG
    _minLevel = .debug
    #endif
  }
  
  /// Set minimum log level
  public func setMinLevel(_ level: LogLevel) {
    minLevel = level
  }
  
  /// Create a child logger with preset context
  public func child(context: LogContext) -> ChildLogger {
    ChildLogger(parent: self, baseContext: context)
  }
  
  // MARK: - Log Methods
  
  public func debug(_ message: String, context: LogContext = LogContext()) {
    log(.debug, message: message, context: context)
  }
  
  public func info(_ message: String, context: LogContext = LogContext()) {
    log(.info, message: message, context: context)
  }
  
  public func warn(_ message: String, context: LogContext = LogContext()) {
    log(.warn, message: message, context: context)
  }
  
  public func error(_ message: String, context: LogContext = LogContext()) {
    log(.error, message: message, context: context)
  }
  
  // MARK: - Core Logging
  
  private func log(_ level: LogLevel, message: String, context: LogContext) {
    guard level >= minLevel else { return }
    
    let entry = buildLogEntry(level: level, message: message, context: context)
    
    // Output to os.log
    let osLogType: OSLogType
    switch level {
    case .debug: osLogType = .debug
    case .info: osLogType = .info
    case .warn: osLogType = .default
    case .error: osLogType = .error
    }
    
    os_log("%{public}@", log: osLog, type: osLogType, entry)
    
    // Add as Sentry breadcrumb
    let breadcrumb = Breadcrumb()
    breadcrumb.message = message
    breadcrumb.category = "log"
    breadcrumb.level = sentryLevel(from: level)
    breadcrumb.data = contextToDict(context)
    SentrySDK.addBreadcrumb(breadcrumb)
    
    // Report errors to Sentry
    if level == .error {
      if let error = context.error {
        SentrySDK.configureScope { scope in
          for (key, value) in self.contextToDict(context) {
            scope.setExtra(value: value, key: key)
          }
        }
        SentrySDK.capture(error: error)
      } else {
        SentrySDK.capture(message: message)
      }
    }
  }
  
  private func buildLogEntry(level: LogLevel, message: String, context: LogContext) -> String {
    var dict: [String: Any] = [
      "timestamp": ISO8601DateFormatter().string(from: Date()),
      "level": level.rawValue,
      "message": message,
      "service": service,
      "platform": platform,
      "environment": environment(),
      "version": appVersion()
    ]
    
    // Add context
    dict["context"] = contextToDict(context)
    
    // Convert to JSON
    if let jsonData = try? JSONSerialization.data(withJSONObject: dict, options: []),
       let jsonString = String(data: jsonData, encoding: .utf8) {
      return jsonString
    }
    
    return "[\(level.rawValue)] \(message)"
  }
  
  private func contextToDict(_ context: LogContext) -> [String: Any] {
    var dict: [String: Any] = context.extras
    
    if let traceId = context.traceId { dict["traceId"] = traceId }
    if let spanId = context.spanId { dict["spanId"] = spanId }
    if let requestId = context.requestId { dict["requestId"] = requestId }
    if let userId = context.userId { dict["userId"] = userId }
    if let operation = context.operation { dict["operation"] = operation }
    if let durationMs = context.durationMs { dict["duration_ms"] = durationMs }
    if let error = context.error { dict["errorMessage"] = error.localizedDescription }
    
    // Remove PII fields
    let piiFields = ["email", "password", "token", "secret", "apiKey"]
    for field in piiFields {
      dict.removeValue(forKey: field)
    }
    
    return dict
  }
  
  private func sentryLevel(from level: LogLevel) -> SentryLevel {
    switch level {
    case .debug: return .debug
    case .info: return .info
    case .warn: return .warning
    case .error: return .error
    }
  }
  
  private func environment() -> String {
    #if DEBUG
    return "development"
    #else
    return "production"
    #endif
  }
  
  private func appVersion() -> String {
    guard let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String,
          let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String else {
      return "unknown"
    }
    return "\(version)+\(build)"
  }
}

/// Child logger with preset context
public final class ChildLogger: @unchecked Sendable {
  private let parent: TallyLogger
  private let baseContext: LogContext
  
  init(parent: TallyLogger, baseContext: LogContext) {
    self.parent = parent
    self.baseContext = baseContext
  }
  
  public func debug(_ message: String, context: LogContext = LogContext()) {
    parent.debug(message, context: mergeContext(context))
  }
  
  public func info(_ message: String, context: LogContext = LogContext()) {
    parent.info(message, context: mergeContext(context))
  }
  
  public func warn(_ message: String, context: LogContext = LogContext()) {
    parent.warn(message, context: mergeContext(context))
  }
  
  public func error(_ message: String, context: LogContext = LogContext()) {
    parent.error(message, context: mergeContext(context))
  }
  
  private func mergeContext(_ context: LogContext) -> LogContext {
    var merged = baseContext
    if let v = context.traceId { merged.traceId = v }
    if let v = context.spanId { merged.spanId = v }
    if let v = context.requestId { merged.requestId = v }
    if let v = context.userId { merged.userId = v }
    if let v = context.operation { merged.operation = v }
    if let v = context.durationMs { merged.durationMs = v }
    if let v = context.error { merged.error = v }
    for (key, value) in context.extras {
      merged.extras[key] = value
    }
    return merged
  }
}
