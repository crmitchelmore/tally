import SwiftUI

@main
struct TallyApp: App {
    @State private var isAuthenticated = false
    
    var body: some Scene {
        WindowGroup {
            if isAuthenticated {
                MainTabView()
            } else {
                WelcomeView(onSignIn: { isAuthenticated = true })
            }
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
        .tint(Color("AccentColor"))
    }
}
