import SwiftUI
import TallyCore

final class AppState: ObservableObject {
  @AppStorage("tally.jwt") var jwt: String = ""
  @AppStorage("tally.apiBase") var apiBase: String = "https://bright-jackal-396.convex.site"
}

struct RootView: View {
  @StateObject private var state = AppState()

  var body: some View {
    TabView {
      ChallengesView()
        .environmentObject(state)
        .tabItem { Label("Challenges", systemImage: "list.bullet") }

      SettingsView()
        .environmentObject(state)
        .tabItem { Label("Settings", systemImage: "gear") }
    }
  }
}
