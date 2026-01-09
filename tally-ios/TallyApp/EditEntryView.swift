import SwiftUI
import TallyCore
import Clerk

struct EditEntryView: View {
  @EnvironmentObject private var state: AppState
  @Environment(\.dismiss) private var dismiss

  let entry: Entry
  let onUpdated: () -> Void

  @State private var count: String
  @State private var note: String
  @State private var errorText: String?
  @State private var isSaving = false

  init(entry: Entry, onUpdated: @escaping () -> Void) {
    self.entry = entry
    self.onUpdated = onUpdated
    _count = State(initialValue: String(Int(entry.count)))
    _note = State(initialValue: entry.note ?? "")
  }

  var body: some View {
    NavigationStack {
      Form {
        Section("Entry") {
          TextField("Count", text: $count)
            .keyboardType(.numberPad)
          TextField("Note (optional)", text: $note)
        }

        Section("Date") {
          Text(entry.date)
            .foregroundStyle(.secondary)
        }

        if let errorText {
          Section("Error") {
            Text(errorText)
              .font(.footnote)
              .foregroundStyle(.red)
          }
        }
      }
      .navigationTitle("Edit Entry")
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
      _ = try await api.updateEntry(
        id: entry._id,
        body: .init(
          count: Double(count) ?? entry.count,
          note: note.isEmpty ? nil : note
        ),
        token: state.jwt
      )

      onUpdated()
      dismiss()
    } catch {
      errorText = String(describing: error)
    }

    isSaving = false
  }
}
