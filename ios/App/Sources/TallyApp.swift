import SwiftUI
import TallyDesign
import TallyFeatureAuth
import TallyFeatureChallenges
import Clerk

@main
struct TallyApp: App {
    @Environment(\.scenePhase) private var scenePhase
    
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
        }
        .onChange(of: scenePhase) { _, newPhase in
            if newPhase == .background {
                // Schedule background refresh when app goes to background
                BackgroundRefreshManager.shared.scheduleBackgroundRefresh()
            }
        }
    }
}
