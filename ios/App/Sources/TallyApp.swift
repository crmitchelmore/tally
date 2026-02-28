import SwiftUI
import TallyDesign
import TallyFeatureAuth
import TallyFeatureChallenges
import TallyCore
import Clerk
import Sentry

/// Appearance mode preference
enum AppearanceMode: String, CaseIterable, Identifiable {
    case system = "system"
    case light = "light"
    case dark = "dark"
    
    var id: String { rawValue }
    
    var label: String { rawValue.capitalized }
    
    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

/// Centralized app settings for shared state
@MainActor
class AppSettings: ObservableObject {
    @AppStorage("appearanceMode") var appearanceMode: AppearanceMode = .system
}

@main
struct TallyApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @StateObject private var appSettings = AppSettings()
    
    init() {
        // Configure Sentry crash reporting
        if let dsn = Configuration.sentryDsn {
            SentrySDK.start { options in
                options.dsn = dsn
                options.tracesSampleRate = 0.2
                options.enableAppHangTracking = true
                options.enableCaptureFailedRequests = true
                options.attachScreenshot = true
                #if DEBUG
                options.environment = "development"
                #else
                options.environment = "production"
                #endif
            }
        }
        
        // Register background refresh tasks on app launch
        BackgroundRefreshManager.shared.registerBackgroundTasks()
    }
    
    var body: some Scene {
        WindowGroup {
            AuthRootView {
                // Signed-in content
                AppView()
            } signedOut: {
                // Signed-out content
                SignInView()
            }
            .environment(\.clerk, Clerk.shared)
            .environmentObject(appSettings)
            .preferredColorScheme(appSettings.appearanceMode.colorScheme)
        }
        .onChange(of: scenePhase) { _, newPhase in
            if newPhase == .background {
                // Schedule background refresh when app goes to background
                BackgroundRefreshManager.shared.scheduleBackgroundRefresh()
            }
        }
    }
}
