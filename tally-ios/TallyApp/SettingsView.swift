import SwiftUI
import Clerk

struct SettingsView: View {
  @EnvironmentObject private var state: AppState
  @Environment(\.clerk) private var clerk

  var body: some View {
    NavigationStack {
      Form {
        Section("API") {
          TextField("Convex HTTP base (https://<deployment>.convex.site)", text: $state.apiBase)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
        }

        Section("Auth") {
          if clerk.user != nil {
            Button(role: .destructive) {
              Task {
                try? await clerk.signOut()
                state.signOut()
              }
            } label: {
              Text("Sign out")
            }
          }
        }
      }
      .navigationTitle("Settings")
    }
  }
}
