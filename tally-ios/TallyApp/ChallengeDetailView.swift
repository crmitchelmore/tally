import SwiftUI
import TallyCore
import Clerk

struct ChallengeDetailView: View {
  @Environment(\.clerk) private var clerk
  @EnvironmentObject private var state: AppState

  let challenge: Challenge

  @State private var entries: [Entry] = []
  @State private var isLoading = false
  @State private var errorText: String?
  @State private var isShowingAddEntry = false

  var body: some View {
    List {
      Section("Challenge") {
        Text(challenge.name).font(.headline)
        Text("Target: \(Int(challenge.targetNumber))")
          .font(.subheadline)
          .foregroundStyle(.secondary)
      }

      Section {
        Button("Add entry") { isShowingAddEntry = true }
          .disabled(state.jwt.isEmpty)
      }

      Section("Entries") {
        if isLoading {
          ProgressView()
        } else if let errorText {
          Text(errorText)
            .font(.footnote)
            .foregroundStyle(.red)
        } else if entries.isEmpty {
          Text("No entries yet")
            .foregroundStyle(.secondary)
        } else {
          ForEach(entries) { e in
            HStack {
              Text(e.date)
              Spacer()
              Text("+\(Int(e.count))")
                .foregroundStyle(.secondary)
            }
          }
          .onDelete { offsets in
            Task { await delete(offsets: offsets) }
          }
        }
      }
    }
    .navigationTitle("Details")
    .toolbar {
      Button("Reload") { Task { await load() } }
    }
    .sheet(isPresented: $isShowingAddEntry) {
      AddEntryView(challengeId: challenge._id) {
        Task { await load() }
      }
      .environmentObject(state)
    }
    .task {
      await state.refreshToken(clerk: clerk)
      await load()
    }
  }

  private func load() async {
    guard let baseURL = URL(string: state.apiBase) else { return }

    isLoading = true
    errorText = nil

    do {
      guard !state.jwt.isEmpty else {
        errorText = "Sign in to view entries"
        entries = []
        isLoading = false
        return
      }

      let api = TallyAPI(baseURL: baseURL)
      entries = try await api.getEntriesByChallenge(challengeId: challenge._id, token: state.jwt)
    } catch {
      errorText = String(describing: error)
    }

    isLoading = false
  }

  private func delete(offsets: IndexSet) async {
    guard let baseURL = URL(string: state.apiBase) else { return }
    guard !state.jwt.isEmpty else { return }

    do {
      let api = TallyAPI(baseURL: baseURL)
      for i in offsets {
        _ = try await api.deleteEntry(id: entries[i]._id, token: state.jwt)
      }
      await load()
    } catch {
      errorText = String(describing: error)
    }
  }
}

private struct AddEntryView: View {
  @EnvironmentObject private var state: AppState
  @Environment(\.dismiss) private var dismiss

  let challengeId: String
  let onAdded: () -> Void

  @State private var count: String = "1"
  @State private var note: String = ""
  @State private var errorText: String?
  @State private var isSaving = false

  var body: some View {
    NavigationStack {
      Form {
        Section("Entry") {
          TextField("Count", text: $count)
            .keyboardType(.numberPad)
          TextField("Note (optional)", text: $note)
        }

        if let errorText {
          Section("Error") {
            Text(errorText)
              .font(.footnote)
              .foregroundStyle(.red)
          }
        }
      }
      .navigationTitle("Add Entry")
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
      let date = ISO8601DateFormatter().string(from: Date()).prefix(10)
      _ = try await api.createEntry(
        .init(
          challengeId: challengeId,
          date: String(date),
          count: Double(count) ?? 1,
          note: note.isEmpty ? nil : note
        ),
        token: state.jwt
      )

      onAdded()
      dismiss()
    } catch {
      errorText = String(describing: error)
    }

    isSaving = false
  }
}
