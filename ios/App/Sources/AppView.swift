import SwiftUI
import TallyDesign
import TallyFeatureAuth

/// Personal goals and settings. Community is unavailable in this release.
struct AppView: View {
    @State private var showSettings = false
    @Environment(\.colorScheme) private var colorScheme
    
    var body: some View {
        ZStack {
            // Paper background
            Color.tallyPaper
                .ignoresSafeArea()
            
            NavigationStack {
                HomeView()
                    .toolbar {
                        ToolbarItem(placement: .navigationBarTrailing) {
                            UserProfileButton { showSettings = true }
                        }
                    }
            }
            .tint(.tallyAccent)
        }
        .sheet(isPresented: $showSettings) {
            SettingsView()
        }
    }
}

#Preview {
    AppView()
}
