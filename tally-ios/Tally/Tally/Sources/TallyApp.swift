import SwiftUI

@main
struct TallyApp: App {
    @State private var authManager = AuthManager.shared
    
    var body: some Scene {
        WindowGroup {
            Group {
                if authManager.isLoading {
                    LoadingView()
                } else if authManager.isAuthenticated {
                    MainTabView()
                } else {
                    WelcomeView()
                }
            }
            .environment(authManager)
            .task {
                await authManager.checkSession()
            }
        }
    }
}

struct LoadingView: View {
    var body: some View {
        VStack {
            ProgressView()
            Text("Loading...")
                .foregroundColor(.secondary)
                .padding(.top, 8)
        }
    }
}

struct MainTabView: View {
    var body: some View {
        TabView {
            ChallengesView()
                .tabItem {
                    Label("Challenges", systemImage: "checkmark.circle.fill")
                }
            
            CommunityView()
                .tabItem {
                    Label("Community", systemImage: "person.2.fill")
                }
            
            LeaderboardView()
                .tabItem {
                    Label("Leaderboard", systemImage: "trophy.fill")
                }
            
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
        }
        .tint(Color.accentColor)
    }
}
