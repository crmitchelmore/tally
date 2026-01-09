import SwiftUI
import TallyCore

final class AppState: ObservableObject {
  private static let jwtKey = "tally.jwt"

  @AppStorage("tally.apiBase") var apiBase: String = "https://bright-jackal-396.convex.site"

  @Published var jwt: String = KeychainService.readString(key: jwtKey) ?? "" {
    didSet {
      if jwt.isEmpty {
        KeychainService.delete(key: Self.jwtKey)
      } else {
        try? KeychainService.writeString(jwt, key: Self.jwtKey)
      }
    }
  }
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
