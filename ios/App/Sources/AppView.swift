import SwiftUI
import TallyDesign
import TallyFeatureAuth

/// Main app view with tab-based navigation
struct AppView: View {
    @State private var selectedTab = 0
    @State private var showSettings = false
    @Environment(\.colorScheme) private var colorScheme
    
    var body: some View {
        ZStack {
            // Paper background
            Color.tallyPaper
                .ignoresSafeArea()
            
            TabView(selection: $selectedTab) {
                NavigationStack {
                    HomeView()
                        .toolbar {
                            ToolbarItem(placement: .navigationBarTrailing) {
                                UserProfileButton {
                                    showSettings = true
                                }
                            }
                        }
                }
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }
                .tag(0)
                
                NavigationStack {
                    CommunityView()
                        .toolbar {
                            ToolbarItem(placement: .navigationBarTrailing) {
                                UserProfileButton {
                                    showSettings = true
                                }
                            }
                        }
                }
                .tabItem {
                    Label("Community", systemImage: "person.2.fill")
                }
                .tag(1)
            }
            .tint(.tallyAccent)
            
            // Sync status indicator at top
            VStack {
                SyncStatusView()
                Spacer()
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView()
        }
    }
}

#Preview {
    AppView()
}
