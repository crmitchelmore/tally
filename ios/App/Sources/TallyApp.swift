import SwiftUI
import TallyDesign
import TallyFeatureAuth
import Clerk

@main
struct TallyApp: App {
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
    }
}
