import Clerk
import SwiftUI
import TallyCore
import TallyFeatureAuth

@main
struct TallyApp: App {
    @StateObject private var appState: AppState
    @State private var clerk = Clerk.shared

    init() {
        _appState = StateObject(wrappedValue: AppState())
    }

    var body: some Scene {
        WindowGroup {
            RootView(state: appState)
                .environment(\.colorScheme, .light)
                .environment(\.clerk, clerk)
                .task {
                    do {
                        let key = try ClerkEnvironment.publishableKey()
                        clerk.configure(publishableKey: key)
                        try await clerk.load()
                    } catch {
                        await appState.failBootstrapping()
                    }
                }
        }
    }
}
