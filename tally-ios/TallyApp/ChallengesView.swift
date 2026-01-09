import SwiftUI
import TallyCore
import Clerk

struct ChallengesView: View {
  @Environment(\.clerk) private var clerk
  @EnvironmentObject private var state: AppState

  @State private var challenges: [Challenge] = []
  @State private var isLoading = false
  @State private var errorText: String?
  @State private var isShowingCreate = false

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
            NavigationLink {
              ChallengeDetailView(challenge: c)
                .environmentObject(state)
            } label: {
              VStack(alignment: .leading, spacing: 4) {
                Text(c.name).font(.headline)
                Text("Target: \(Int(c.targetNumber))")
                  .font(.subheadline)
                  .foregroundStyle(.secondary)
              }
            }
          }
        }
      }
      .navigationTitle("Challenges")
      .toolbar {
        ToolbarItem(placement: .topBarLeading) {
          Button("Reload") { Task { await load() } }
        }
        ToolbarItem(placement: .topBarTrailing) {
          Button("New") { isShowingCreate = true }
            .disabled(clerk.user == nil)
        }
      }
      .sheet(isPresented: $isShowingCreate) {
        CreateChallengeView {
          Task { await load() }
        }
        .environmentObject(state)
      }
      .task { await load() }
    }
  }

  private func load() async {
    isLoading = true
    errorText = nil

    do {
      let api = TallyAPI(baseURL: URL(string: state.apiBase)!)

      if clerk.user != nil {
        await state.refreshToken(clerk: clerk)
        await state.syncUserToConvex()

        if !state.jwt.isEmpty {
          challenges = try await api.getChallenges(token: state.jwt)
        } else {
          challenges = try await api.getPublicChallenges()
        }
      } else {
        challenges = try await api.getPublicChallenges()
      }
    } catch {
      errorText = String(describing: error)
    }

    isLoading = false
  }
}
