import SwiftUI
import TallyCore
import Clerk

final class AppState: ObservableObject {
  private static let jwtKey = "tally.jwt"

  @AppStorage("tally.apiBase") var apiBase: String = "https://bright-jackal-396.convex.site"

  // Kept as a cache for API calls; populated from Clerk session tokens.
  @Published var jwt: String = KeychainService.readString(key: jwtKey) ?? "" {
    didSet {
      if jwt.isEmpty {
        KeychainService.delete(key: Self.jwtKey)
      } else {
        try? KeychainService.writeString(jwt, key: Self.jwtKey)
      }
    }
  }

  func signOut() {
    jwt = ""
  }
}

struct RootView: View {
  @Environment(\.clerk) private var clerk
  @StateObject private var state = AppState()

  var body: some View {
    Group {
      if clerk.user != nil {
        TabView {
          ChallengesView()
            .environmentObject(state)
            .tabItem { Label("Challenges", systemImage: "list.bullet") }

          SettingsView()
            .environmentObject(state)
            .tabItem { Label("Settings", systemImage: "gear") }
        }
        .task {
          await refreshToken()
        }
      } else {
        LoginView()
          .environmentObject(state)
      }
    }
  }

  private func refreshToken() async {
    guard let session = clerk.session else { return }

    do {
      let token = try await session.getToken(GetTokenOptions(template: "convex"))
      if let jwt = token?.jwt, !jwt.isEmpty {
        state.jwt = jwt
      }
    } catch {
      // Ignore; API calls will fall back to public endpoints until available.
    }
  }
}
