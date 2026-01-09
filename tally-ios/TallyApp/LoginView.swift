import SwiftUI
import Clerk

struct LoginView: View {
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
          }

          Section("API") {
            TextField("Convex HTTP base", text: $state.apiBase)
              .textInputAutocapitalization(.never)
              .autocorrectionDisabled()
          }
        }
        .navigationTitle("Welcome")
      } else {
        AuthView(mode: .signInOrUp, isDismissable: false)
          .navigationTitle("Sign in")
      }
    }
  }
}
