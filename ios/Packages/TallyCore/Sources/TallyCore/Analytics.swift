import Foundation
import PostHog

/// Explicit product events only. No goal names, notes, email addresses, or replay.
@MainActor
public enum Analytics {
    public enum Event: String {
        case appOpened = "app_opened"
        case signedIn = "auth_signed_in"
        case signedOut = "auth_signed_out"
        case challengeCreated = "challenge_created"
        case challengeUpdated = "challenge_updated"
        case challengeArchived = "challenge_archived"
        case entryCreated = "entry_created"
        case entryUpdated = "entry_updated"
        case entryDeleted = "entry_deleted"
    }
    private static var enabled = false
    private static var identifiedUser: String?
    private static let identityKey = "tally.analytics.identifiedUser"

    public static func configure() {
        guard !enabled, !CommandLine.arguments.contains("--uitesting"),
              ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] == nil,
              let key = Bundle.main.object(forInfoDictionaryKey: "POSTHOG_KEY") as? String,
              !key.isEmpty, !key.hasPrefix("$(") else { return }
        let host = Bundle.main.object(forInfoDictionaryKey: "POSTHOG_HOST") as? String
        let config = PostHogConfig(apiKey: key, host: host?.isEmpty == false ? host! : "https://eu.i.posthog.com")
        config.captureApplicationLifecycleEvents = false
        config.captureScreenViews = false
        config.sessionReplay = false
        config.captureElementInteractions = false
        config.capturePushNotificationSubscriptions = false
        config.capturePushNotificationOpened = false
        config.errorTrackingConfig.autoCapture = false
        PostHogSDK.shared.setup(config)
        identifiedUser = UserDefaults.standard.string(forKey: identityKey)
        enabled = true
        capture(.appOpened)
    }

    public static func identify(_ userID: String?) {
        guard enabled, identifiedUser != userID else { return }
        if identifiedUser != nil {
            capture(.signedOut)
            PostHogSDK.shared.reset()
        }
        identifiedUser = userID
        UserDefaults.standard.set(userID, forKey: identityKey)
        if let userID {
            PostHogSDK.shared.identify(userID)
            capture(.signedIn)
        }
    }

    public static func capture(_ event: Event) {
        guard enabled else { return }
        #if DEBUG
        let environment = "development"
        #else
        let environment = "production"
        #endif
        PostHogSDK.shared.capture(event.rawValue, properties: [
            "platform": "ios", "source": "client", "env": environment,
            "app_version": Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "unknown",
            "build_number": Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String ?? "unknown",
            "is_signed_in": identifiedUser != nil
        ])
    }

    public static func flush() {
        if enabled { PostHogSDK.shared.flush() }
    }
}
