import SwiftUI
import TallyDesign
import TallyFeatureAuth
import TallyFeatureChallenges
import Clerk

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
