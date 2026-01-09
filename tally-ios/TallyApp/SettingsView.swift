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

        Section("Auth (development)") {
          SecureField("Clerk JWT (optional)", text: $state.jwt)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
          Text("If empty, the app uses public endpoints only.")
            .font(.footnote)
            .foregroundStyle(.secondary)
        }
      }
      .navigationTitle("Settings")
    }
  }
}
