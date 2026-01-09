import SwiftUI
import TallyCore

struct CreateChallengeView: View {
  @EnvironmentObject private var state: AppState
  @Environment(\.dismiss) private var dismiss

  @State private var name: String = ""
  @State private var target: String = "10"
  @State private var errorText: String?
  @State private var isSaving = false

  let onCreated: () -> Void

  var body: some View {
    NavigationStack {
      Form {
        Section("Challenge") {
          TextField("Name", text: $name)
          TextField("Target", text: $target)
            .keyboardType(.numberPad)
        }

        Section("Defaults") {
          Text("Year timeframe, blue, 🔥")
            .font(.footnote)
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
      .navigationTitle("New Challenge")
      .toolbar {
        ToolbarItem(placement: .cancellationAction) {
          Button("Cancel") { dismiss() }
        }
        ToolbarItem(placement: .confirmationAction) {
          Button(isSaving ? "Saving…" : "Create") {
            Task { await create() }
          }
          .disabled(isSaving || name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        }
      }
    }
  }

  private func create() async {
    guard let baseURL = URL(string: state.apiBase) else { return }
    guard !state.jwt.isEmpty else {
      errorText = "Missing auth token"
      return
    }

    isSaving = true
    errorText = nil

    do {
      let api = TallyAPI(baseURL: baseURL)
      let year = Double(Calendar.current.component(.year, from: Date()))
      _ = try await api.createChallenge(
        .init(
          name: name,
          targetNumber: Double(target) ?? 10,
          year: year,
          color: "blue",
          icon: "🔥",
          timeframeUnit: .year,
          isPublic: false
        ),
        token: state.jwt
      )

      onCreated()
      dismiss()
    } catch {
      errorText = String(describing: error)
    }

    isSaving = false
  }
}
