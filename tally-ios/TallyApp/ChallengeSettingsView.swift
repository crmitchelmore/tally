import SwiftUI
import TallyCore
import Clerk

struct ChallengeSettingsView: View {
  @EnvironmentObject private var state: AppState
  @Environment(\.dismiss) private var dismiss

  let challenge: Challenge
  let onUpdated: () -> Void

  @State private var isPublic: Bool
  @State private var errorText: String?
  @State private var isSaving = false
  @State private var isArchiving = false
  @State private var showArchiveConfirm = false

  init(challenge: Challenge, onUpdated: @escaping () -> Void) {
    self.challenge = challenge
    self.onUpdated = onUpdated
    _isPublic = State(initialValue: challenge.isPublic ?? false)
  }

  var body: some View {
    NavigationStack {
      Form {
        Section("Visibility") {
          Toggle("Public Challenge", isOn: $isPublic)
          Text("Public challenges appear on the leaderboard and can be followed by others.")
            .font(.footnote)
            .foregroundStyle(.secondary)
        }

        Section("Danger Zone") {
          Button(role: .destructive) {
            showArchiveConfirm = true
          } label: {
            HStack {
              Image(systemName: "archivebox")
              Text("Archive Challenge")
            }
          }
          .disabled(isArchiving)
        }

        if let errorText {
          Section("Error") {
            Text(errorText)
              .font(.footnote)
              .foregroundStyle(.red)
          }
        }
      }
      .navigationTitle("Settings")
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Cancel") { dismiss() }
        }
        ToolbarItem(placement: .confirmationAction) {
          Button(isSaving ? "Saving…" : "Save") {
            Task { await save() }
          }
          .disabled(isSaving)
        }
      }
      .alert("Archive Challenge?", isPresented: $showArchiveConfirm) {
        Button("Cancel", role: .cancel) { }
        Button("Archive", role: .destructive) {
          Task { await archive() }
        }
      } message: {
        Text("This will hide the challenge from your dashboard. You can unarchive it later.")
      }
    }
  }

  private func save() async {
    guard let baseURL = URL(string: state.apiBase) else { return }
    guard !state.jwt.isEmpty else {
      errorText = "Missing auth token"
      return
    }

    isSaving = true
    errorText = nil

    do {
      let api = TallyAPI(baseURL: baseURL)
      _ = try await api.updateChallenge(
        id: challenge._id,
        body: .init(isPublic: isPublic),
        token: state.jwt
      )

      onUpdated()
      dismiss()
    } catch {
      errorText = String(describing: error)
    }

    isSaving = false
  }

  private func archive() async {
    guard let baseURL = URL(string: state.apiBase) else { return }
    guard !state.jwt.isEmpty else {
      errorText = "Missing auth token"
      return
    }

    isArchiving = true
    errorText = nil

    do {
      let api = TallyAPI(baseURL: baseURL)
      _ = try await api.updateChallenge(
        id: challenge._id,
        body: .init(archived: true),
        token: state.jwt
      )

      onUpdated()
      dismiss()
    } catch {
      errorText = String(describing: error)
    }

    isArchiving = false
  }
}
