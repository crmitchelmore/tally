import SwiftUI
import TallyDesign

/// Personal goals and settings. Community is unavailable in this release.
struct AppView: View {
    @State private var showSettings = false

    var body: some View {
        HomeView(onOpenSettings: { showSettings = true })
            .tint(.tallyAccent)
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
    }
}

#Preview {
    AppView()
}
