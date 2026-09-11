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
    @State private var showPrivacyChoice = false
    @StateObject private var appSettings = AppSettings()
    
    init() {
        if CommandLine.arguments.contains("--uitesting") {
            if CommandLine.arguments.contains("--privacy-testing") {
                UserDefaults.standard.removeObject(forKey: PrivacyPreferences.choiceKey)
            } else { PrivacyPreferences().save(analytics: false, diagnostics: false) }
        }
        Analytics.configure()
        Diagnostics.applyPrivacyChoice()

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
            .task {
                showPrivacyChoice = !PrivacyPreferences().hasChosen &&
                    (!CommandLine.arguments.contains("--uitesting") || CommandLine.arguments.contains("--privacy-testing"))
            }
            .sheet(isPresented: $showPrivacyChoice) { PrivacyChoicesView() }

        }
        .onChange(of: scenePhase) { _, newPhase in
            if newPhase == .background {
                Analytics.flush()
                // Schedule background refresh when app goes to background
                BackgroundRefreshManager.shared.scheduleBackgroundRefresh()
            }
        }
    }
}
