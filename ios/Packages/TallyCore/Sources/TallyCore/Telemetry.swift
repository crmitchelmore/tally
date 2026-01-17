import Foundation

public enum TelemetryEvent: String, Sendable {
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
}

public enum AuthEvent: Sendable {
    case signedIn(userId: String)
    case signedOut(userId: String?)
}

public struct TelemetryContext: Codable, Sendable {
    public let platform: String
    public let env: String
    public let appVersion: String?
    public let buildNumber: String?
    public let userId: String?
    public let isSignedIn: Bool
    public let sessionId: String
    public let traceId: String
    public let spanId: String
    public let requestId: String

    public init(
        platform: String,
        env: String,
        appVersion: String?,
        buildNumber: String?,
        userId: String?,
        isSignedIn: Bool,
        sessionId: String,
        traceId: String,
        spanId: String,
        requestId: String
    ) {
        self.platform = platform
        self.env = env
        self.appVersion = appVersion
        self.buildNumber = buildNumber
        self.userId = userId
        self.isSignedIn = isSignedIn
        self.sessionId = sessionId
        self.traceId = traceId
        self.spanId = spanId
        self.requestId = requestId
    }
}

public struct TelemetryTrace: Sendable {
    public let traceId: String
    public let spanId: String
    public let requestId: String
}

public protocol TelemetryClient: Sendable {
    func capture(_ event: TelemetryEvent, properties: [String: String], context: TelemetryContext) async
    func logWideEvent(_ event: TelemetryEvent, properties: [String: String], context: TelemetryContext) async
}

public final class TelemetryStore: @unchecked Sendable {
    public static let shared = TelemetryStore()
    public var client: TelemetryClient?
    public var contextProvider: (() -> TelemetryContext)?

    private init() {}
}

public func makeTrace() -> TelemetryTrace {
    TelemetryTrace(
        traceId: UUID().uuidString.lowercased(),
        spanId: UUID().uuidString.lowercased(),
        requestId: UUID().uuidString.lowercased()
    )
}
