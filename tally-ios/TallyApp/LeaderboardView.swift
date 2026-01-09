import SwiftUI
import TallyCore
import Clerk

struct LeaderboardView: View {
  @Environment(\.clerk) private var clerk
  @EnvironmentObject private var state: AppState

  @State private var leaderboard: [TallyAPI.LeaderboardRow] = []
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
        } else if leaderboard.isEmpty {
          VStack(spacing: 12) {
            Image(systemName: "trophy")
              .font(.system(size: 44))
              .foregroundStyle(.secondary)
            Text("No public challenges yet")
              .font(.headline)
            Text("Be the first! Make your challenges public to appear on the leaderboard.")
              .font(.footnote)
              .foregroundStyle(.secondary)
              .multilineTextAlignment(.center)
          }
          .padding()
        } else {
          List {
            ForEach(Array(leaderboard.enumerated()), id: \.element.challenge._id) { index, row in
              HStack(spacing: 12) {
                Text("#\(index + 1)")
                  .font(.headline)
                  .foregroundStyle(index < 3 ? .primary : .secondary)
                  .frame(width: 40)
                
                VStack(alignment: .leading, spacing: 2) {
                  Text(row.challenge.name)
                    .font(.headline)
                  Text("Target: \(Int(row.challenge.targetNumber))")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                  Text("\(Int(row.followers)) followers")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                }
              }
              .padding(.vertical, 4)
            }
          }
        }
      }
      .navigationTitle("Leaderboard")
      .toolbar {
        Button("Reload") { Task { await load() } }
      }
      .task { await load() }
    }
  }

  private func load() async {
    guard let baseURL = URL(string: state.apiBase) else { return }

    isLoading = true
    errorText = nil

    do {
      let api = TallyAPI(baseURL: baseURL)
      leaderboard = try await api.getLeaderboard()
    } catch {
      errorText = String(describing: error)
    }

    isLoading = false
  }
}
