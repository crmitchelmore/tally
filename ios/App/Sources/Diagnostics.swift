import Foundation
import Sentry
import TallyCore

@MainActor
enum Diagnostics {
    private static var started = false
    static func applyPrivacyChoice() {
        guard PrivacyPreferences().diagnosticsEnabled,
              !CommandLine.arguments.contains("--uitesting"),
              ProcessInfo.processInfo.environment["XCTestConfigurationFilePath"] == nil,
              let dsn = Configuration.sentryDsn else {
            if started { SentrySDK.close(); started = false }
            return
        }
        guard !started else { return }
        SentrySDK.start { options in
            options.dsn = dsn
            options.tracesSampleRate = 0
            options.enableAppHangTracking = true
            options.enableCaptureFailedRequests = false
            options.attachScreenshot = false
            options.attachViewHierarchy = false
            options.sendDefaultPii = false
            options.maxBreadcrumbs = 0
            options.beforeSend = { event in
                guard PrivacyPreferences().diagnosticsEnabled else { return nil }
                event.user = nil
                return event
            }
            #if DEBUG
            options.environment = "development"
            #else
            options.environment = "production"
            #endif
        }
        started = true
    }
}
