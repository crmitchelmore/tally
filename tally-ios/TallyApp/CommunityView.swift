import SwiftUI
import TallyCore
import Clerk

struct CommunityView: View {
  @Environment(\.clerk) private var clerk
  @EnvironmentObject private var state: AppState

  @State private var challenges: [Challenge] = []
  @State private var followedIds: Set<String> = []
  @State private var isLoading = false
  @State private var errorText: String?
  @State private var searchText: String = ""

  var filteredChallenges: [Challenge] {
    if searchText.isEmpty {
      return challenges
    }
    return challenges.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
  }

  var body: some View {
    NavigationStack {
      Group {
        if isLoading {
          ProgressView()
        } else if let errorText {
          VStack(spacing: 12) {
            Image(systemName: "exclamationmark.triangle")
              .font(.largeTitle)
              .foregroundStyle(.secondary)
            Text("Could not load")
              .font(.headline)
            Text(errorText)
              .font(.footnote)
              .foregroundStyle(.secondary)
              .multilineTextAlignment(.center)
          }
          .padding()
        } else if filteredChallenges.isEmpty {
          VStack(spacing: 12) {
            Image(systemName: "person.2")
              .font(.largeTitle)
              .foregroundStyle(.secondary)
            Text(searchText.isEmpty ? "No public challenges yet" : "No matches")
              .font(.headline)
            Text(searchText.isEmpty
                 ? "Be the first! Make your challenges public to share with the community."
                 : "Try a different search term")
              .font(.footnote)
              .foregroundStyle(.secondary)
              .multilineTextAlignment(.center)
          }
          .padding()
        } else {
          List(filteredChallenges) { challenge in
            VStack(alignment: .leading, spacing: 8) {
              HStack {
                VStack(alignment: .leading, spacing: 4) {
                  Text(challenge.name)
                    .font(.headline)
                  Text("Target: \(Int(challenge.targetNumber))")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                }
                
                Spacer()
                
                if !state.jwt.isEmpty {
                  Button {
                    Task { await toggleFollow(challenge) }
                  } label: {
                    Image(systemName: followedIds.contains(challenge._id) ? "star.fill" : "star")
                      .foregroundStyle(followedIds.contains(challenge._id) ? .yellow : .gray)
                  }
                  .buttonStyle(.plain)
                }
              }
            }
            .padding(.vertical, 4)
          }
        }
      }
      .navigationTitle("Community")
      .searchable(text: $searchText, prompt: "Search challenges")
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
      challenges = try await api.getPublicChallenges()
      
      // Load followed challenges if signed in
      if !state.jwt.isEmpty {
        let followed = try await api.getFollowed(token: state.jwt)
        followedIds = Set(followed.map { $0.challengeId })
      }
    } catch {
      errorText = String(describing: error)
    }

    isLoading = false
  }

  private func toggleFollow(_ challenge: Challenge) async {
    guard let baseURL = URL(string: state.apiBase) else { return }
    guard !state.jwt.isEmpty else { return }

    do {
      let api = TallyAPI(baseURL: baseURL)
      if followedIds.contains(challenge._id) {
        _ = try await api.unfollow(idOrChallengeId: challenge._id, token: state.jwt)
        followedIds.remove(challenge._id)
      } else {
        _ = try await api.follow(challengeId: challenge._id, token: state.jwt)
        followedIds.insert(challenge._id)
      }
    } catch {
      errorText = String(describing: error)
    }
  }
}
