import SwiftUI

struct LoginView: View {
  @EnvironmentObject private var state: AppState

  @State private var jwt: String = ""

  var body: some View {
    NavigationStack {
      Form {
        Section("Sign in") {
          Text("For now, the iOS app uses a Clerk JWT (copied from the web app session) to access authenticated endpoints.")
            .font(.footnote)
            .foregroundStyle(.secondary)

          Link("Open web sign-in", destination: URL(string: "https://tally-tracker.app/sign-in")!)

          SecureField("Clerk JWT", text: $jwt)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()

          Button("Save token") {
            state.jwt = jwt.trimmingCharacters(in: .whitespacesAndNewlines)
          }
          .disabled(jwt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }

        Section("API") {
          TextField("Convex HTTP base", text: $state.apiBase)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
        }
      }
      .navigationTitle("Welcome")
    }
  }
}
