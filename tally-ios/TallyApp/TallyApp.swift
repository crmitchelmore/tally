import SwiftUI
import TallyCore
import Clerk

@main
struct TallyApp: App {
  @State private var clerk = Clerk.shared

  var body: some Scene {
    WindowGroup {
      RootView()
        .environment(\.clerk, clerk)
        .task {
          let key = (Bundle.main.object(forInfoDictionaryKey: "CLERK_PUBLISHABLE_KEY") as? String) ?? ""
          if key.isEmpty {
            return
          }

          clerk.configure(publishableKey: key)
          try? await clerk.load()
        }
    }
  }
}
