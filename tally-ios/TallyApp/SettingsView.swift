import SwiftUI
import Clerk
import TallyCore

struct SettingsView: View {
  @EnvironmentObject private var state: AppState
  @EnvironmentObject private var featureFlags: FeatureFlags
  @Environment(\.clerk) private var clerk

  var body: some View {
    NavigationStack {
      Form {
        Section("API") {
          TextField("Convex HTTP base (https://<deployment>.convex.site)", text: $state.apiBase)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
        }

        Section("Feature Flags") {
          HStack {
            Text("Streaks Enabled")
            Spacer()
            if featureFlags.streaksEnabled {
              Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(.green)
            } else {
              Image(systemName: "xmark.circle.fill")
                .foregroundStyle(.secondary)
            }
          }
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
