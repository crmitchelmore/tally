import Foundation

/// Optional telemetry is disabled until a person makes an explicit choice on this device.
public struct PrivacyPreferences {
    public static let analyticsKey = "tally.privacy.analytics"
    public static let diagnosticsKey = "tally.privacy.diagnostics"
    public static let choiceKey = "tally.privacy.choice.v1"
    private let defaults: UserDefaults

    public init(defaults: UserDefaults = .standard) { self.defaults = defaults }
    public var hasChosen: Bool { defaults.bool(forKey: Self.choiceKey) }
    public var analyticsEnabled: Bool { hasChosen && defaults.bool(forKey: Self.analyticsKey) }
    public var diagnosticsEnabled: Bool { hasChosen && defaults.bool(forKey: Self.diagnosticsKey) }
    public func save(analytics: Bool, diagnostics: Bool) {
        defaults.set(analytics, forKey: Self.analyticsKey)
        defaults.set(diagnostics, forKey: Self.diagnosticsKey)
        defaults.set(true, forKey: Self.choiceKey)
    }
}
