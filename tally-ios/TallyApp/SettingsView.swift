import SwiftUI

struct SettingsView: View {
  @EnvironmentObject private var state: AppState

  var body: some View {
    NavigationStack {
      Form {
        Section("API") {
          TextField("Convex HTTP base (https://<deployment>.convex.site)", text: $state.apiBase)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
        }

        Section("Auth") {
          Text("Signed in")
            .font(.footnote)
            .foregroundStyle(.secondary)

          Button(role: .destructive) {
            state.signOut()
          } label: {
            Text("Sign out")
          }
        }
      }
      .navigationTitle("Settings")
    }
  }
}
