import SwiftUI
import TallyCore
import TallyFeatureAuth

@main
struct TallyApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            RootView(state: appState)
                .environment(\.colorScheme, .light)
        }
    }
}
