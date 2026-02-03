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
    
    var label: String {
        switch self {
        case .system: return "System"
        case .light: return "Light"
        case .dark: return "Dark"
        }
    }
    
    var colorScheme: ColorScheme? {
        switch self {
        case .system: return nil
        case .light: return .light
        case .dark: return .dark
        }
    }
}

@main
struct TallyApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @AppStorage("appearanceMode") private var appearanceMode: AppearanceMode = .system
    
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
            .preferredColorScheme(appearanceMode.colorScheme)
        }
        .onChange(of: scenePhase) { _, newPhase in
            if newPhase == .background {
                // Schedule background refresh when app goes to background
                BackgroundRefreshManager.shared.scheduleBackgroundRefresh()
            }
        }
    }
}
