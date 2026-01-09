import SwiftUI
import TallyCore

struct ChallengesView: View {
  @EnvironmentObject private var state: AppState

  @State private var challenges: [Challenge] = []
  @State private var isLoading = false
  @State private var errorText: String?

  var body: some View {
    NavigationStack {
      Group {
        if isLoading {
          ProgressView()
        } else if let errorText {
          VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
              .font(.system(size: 44))
              .foregroundStyle(.secondary)
            Text("Could not load")
              .font(.headline)
            Text(errorText)
              .font(.footnote)
              .foregroundStyle(.secondary)
              .multilineTextAlignment(.center)
          }
          .padding()
        } else {
          List(challenges) { c in
            VStack(alignment: .leading, spacing: 4) {
              Text(c.name).font(.headline)
              Text("Target: \(Int(c.targetNumber))")
                .font(.subheadline)
                .foregroundStyle(.secondary)
            }
          }
        }
      }
      .navigationTitle("Challenges")
      .toolbar {
        Button("Reload") { Task { await load() } }
      }
      .task { await load() }
    }
  }

  private func load() async {
    isLoading = true
    errorText = nil

    do {
      let api = TallyAPI(baseURL: URL(string: state.apiBase)!)
      if state.jwt.isEmpty {
        challenges = try await api.getPublicChallenges()
      } else {
        challenges = try await api.getChallenges(token: state.jwt)
      }
    } catch {
      errorText = String(describing: error)
    }

    isLoading = false
  }
}
