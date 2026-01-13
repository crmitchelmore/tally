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

  func refreshToken(clerk: Clerk) async {
    guard let session = await clerk.session else { return }

    do {
      let token = try await session.getToken(Session.GetTokenOptions(template: "convex"))
      if let jwt = token?.jwt, !jwt.isEmpty {
        self.jwt = jwt
      }
    } catch {
      return
    }
  }

  func syncUserToConvex() async {
    guard !jwt.isEmpty else { return }
    guard let base = URL(string: apiBase) else { return }

    var request = URLRequest(url: base.appending(path: "/api/auth/user"))
    request.httpMethod = "POST"
    request.setValue("Bearer \(jwt)", forHTTPHeaderField: "Authorization")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.httpBody = Data("{}".utf8)

    _ = try? await URLSession.shared.data(for: request)
  }
}

struct RootView: View {
  @Environment(\.clerk) private var clerk
  @StateObject private var state = AppState()
  let isClerkLoaded: Bool

  var body: some View {
    Group {
      if !isClerkLoaded {
        // Show loading while Clerk initializes
        VStack(spacing: 16) {
          ProgressView()
          Text("Loading...")
            .font(.subheadline)
            .foregroundStyle(.secondary)
        }
      } else if clerk.user != nil {
        TabView {
          ChallengesView()
            .environmentObject(state)
            .tabItem { Label("Challenges", systemImage: "list.bullet") }

          LeaderboardView()
            .environmentObject(state)
            .tabItem { Label("Leaderboard", systemImage: "trophy") }

          CommunityView()
            .environmentObject(state)
            .tabItem { Label("Community", systemImage: "person.2") }

          SettingsView()
            .environmentObject(state)
            .tabItem { Label("Settings", systemImage: "gear") }
        }
        .task {
          await state.refreshToken(clerk: clerk)
          await state.syncUserToConvex()
        }
        .onChange(of: clerk.user?.id) { _, newValue in
          if newValue == nil {
            state.signOut()
          } else {
            Task {
              await state.refreshToken(clerk: clerk)
              await state.syncUserToConvex()
            }
          }
        }
      } else {
        LoginView()
          .environmentObject(state)
      }
    }
  }

}
