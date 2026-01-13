import SwiftUI
import Clerk

struct LoginView: View {
  @Environment(\.clerk) private var clerk
  @EnvironmentObject private var state: AppState

  private var publishableKey: String {
    (Bundle.main.object(forInfoDictionaryKey: "CLERK_PUBLISHABLE_KEY") as? String) ?? ""
  }

  var body: some View {
    NavigationStack {
      if publishableKey.isEmpty {
        Form {
          Section("Clerk") {
            Text("Set CLERK_PUBLISHABLE_KEY in the iOS build settings to enable native sign-in.")
              .font(.footnote)
              .foregroundStyle(.secondary)
              .accessibilityIdentifier("clerk-setup-hint")
          }

          Section("API") {
            TextField("Convex HTTP base", text: $state.apiBase)
              .textInputAutocapitalization(.never)
              .autocorrectionDisabled()
              .accessibilityIdentifier("api-base-field")
          }
        }
        .navigationTitle("Welcome")
      } else if !clerk.isLoaded {
        VStack(spacing: 16) {
          ProgressView()
            .accessibilityIdentifier("loading-indicator")
          Text("Loading...")
            .foregroundStyle(.secondary)
        }
        .navigationTitle("Sign in")
      } else {
        AuthView(mode: .signInOrUp, isDismissable: false)
          .navigationTitle("Sign in")
          .accessibilityIdentifier("clerk-auth-view")
      }
    }
  }
}
