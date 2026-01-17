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
        let sessionId = UUID().uuidString.lowercased()
        TelemetryStore.shared.contextProvider = {
            let trace = makeTrace()
            return TelemetryContext(
                platform: "ios",
                env: ClerkEnvironment.telemetryEnvironment(),
                appVersion: Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String,
                buildNumber: Bundle.main.object(forInfoDictionaryKey: "CFBundleVersion") as? String,
                userId: nil,
                isSignedIn: false,
                sessionId: sessionId,
                traceId: trace.traceId,
                spanId: trace.spanId,
                requestId: trace.requestId
            )
        }
        TelemetryStore.shared.client = AppTelemetryClient()
    }

    var body: some Scene {
        WindowGroup {
            RootView(state: appState)
                .environment(\.colorScheme, .light)
                .environment(\.clerk, clerk)
                .task {
                    do {
                        if let context = TelemetryStore.shared.contextProvider?(),
                           let client = TelemetryStore.shared.client {
                            await client.capture(.appOpened, properties: [:], context: context)
                            await client.logWideEvent(.appOpened, properties: [:], context: context)
                        }
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
