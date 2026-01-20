import SwiftUI
import TallyCore
import TallyFeatureAPIClient

#if canImport(UIKit)
import UIKit
#endif

public struct EntryFormData: Equatable, Sendable {
    public let challengeId: String
    public let date: String
    public let count: Int
    public let note: String?
    public let sets: [EntrySet]?
    public let feeling: String?
}

@available(iOS 17, macOS 13, *)
public struct EntryFormView: View {
    public enum Mode {
        case create(challengeId: String)
        case edit(Entry)
    }

    let mode: Mode
    let onSave: @Sendable (EntryFormData) async -> Void

    @Environment(\.dismiss) private var dismiss
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    @State private var date: Date = Date()
    @State private var count: String = ""
    @State private var note: String = ""
    @State private var feeling: String = ""
    @State private var usesSets = false
    @State private var setsCount: Int = 1
    @State private var repsPerSet: Int = 5
    @State private var showSuccess = false

    public init(mode: Mode, onSave: @Sendable @escaping (EntryFormData) async -> Void) {
        self.mode = mode
        self.onSave = onSave
    }

    public var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Entry")) {
                    DatePicker("Date", selection: $date, in: ...Date(), displayedComponents: .date)
                    Toggle("Track sets", isOn: $usesSets)
                    if usesSets {
                        Stepper("Sets \(setsCount)", value: $setsCount, in: 1...50)
                        Stepper("Reps \(repsPerSet)", value: $repsPerSet, in: 1...100)
                        Text("Total \(derivedCount)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    } else {
                        #if canImport(UIKit)
                        TextField("Count", text: $count)
                            .keyboardType(.numberPad)
                        #else
                        TextField("Count", text: $count)
                        #endif
                    }
                }

                Section(header: Text("Details")) {
                    TextField("Note", text: $note)
                    Picker("Feeling", selection: $feeling) {
                        Text("None").tag("")
                        Text("Very easy").tag("very-easy")
                        Text("Easy").tag("easy")
                        Text("Moderate").tag("moderate")
                        Text("Hard").tag("hard")
                        Text("Very hard").tag("very-hard")
                    }
                }

                if showSuccess {
                    Section {
                        TallyStrokeView(progress: showSuccess ? 1 : 0)
                            .frame(height: 40)
                    }
                }
            }
            .navigationTitle(modeTitle)
            .toolbar {
                #if canImport(UIKit)
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        Task { await save() }
                    }
                    .disabled(!isValid)
                }
                #else
                ToolbarItem(placement: .automatic) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .automatic) {
                    Button("Save") {
                        Task { await save() }
                    }
                    .disabled(!isValid)
                }
                #endif
            }
        }
        .onAppear(perform: loadFromMode)
    }

    private var modeTitle: String {
        switch mode {
        case .create:
            return "New Entry"
        case .edit:
            return "Edit Entry"
        }
    }

    private var derivedCount: Int {
        if usesSets {
            return max(1, setsCount * repsPerSet)
        }
        return max(1, Int(count) ?? 0)
    }

    private var isValid: Bool {
        derivedCount > 0
    }

    private func loadFromMode() {
        guard case .edit(let entry) = mode else { return }
        date = parseDate(entry.date)
        count = String(entry.count)
        note = entry.note ?? ""
        feeling = entry.feeling ?? ""
        if let sets = entry.sets, let first = sets.first {
            usesSets = true
            setsCount = max(1, sets.count)
            repsPerSet = max(1, first.reps)
        }
    }

    private func save() async {
        #if canImport(UIKit)
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
        #endif
        await onSave(EntryFormData(
            challengeId: challengeId,
            date: isoDate(date),
            count: derivedCount,
            note: note.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : note,
            sets: usesSets ? Array(repeating: EntrySet(reps: repsPerSet), count: setsCount) : nil,
            feeling: feeling.isEmpty ? nil : feeling
        ))

        if reduceMotion {
            showSuccess = true
            dismiss()
        } else {
            withAnimation(.easeOut(duration: 0.3)) {
                showSuccess = true
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                dismiss()
            }
        }
    }

    private var challengeId: String {
        switch mode {
        case .create(let id):
            return id
        case .edit(let entry):
            return entry.challengeId
        }
    }
}

private func isoDate(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    formatter.timeZone = TimeZone(secondsFromGMT: 0)
    return formatter.string(from: date)
}

private func parseDate(_ iso: String) -> Date {
    let components = iso.split(separator: "-").compactMap { Int($0) }
    guard components.count == 3 else { return Date() }
    var dateComponents = DateComponents()
    dateComponents.year = components[0]
    dateComponents.month = components[1]
    dateComponents.day = components[2]
    dateComponents.timeZone = TimeZone(secondsFromGMT: 0)
    return Calendar(identifier: .gregorian).date(from: dateComponents) ?? Date()
}

private struct TallyStrokeView: View {
    let progress: CGFloat

    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            let height = proxy.size.height
            Path { path in
                let step = width / 6
                for index in 0..<4 {
                    let x = step + CGFloat(index) * step
                    path.move(to: CGPoint(x: x, y: height * 0.2))
                    path.addLine(to: CGPoint(x: x, y: height * 0.85))
                }
                path.move(to: CGPoint(x: step * 0.6, y: height * 0.2))
                path.addLine(to: CGPoint(x: step * 4.4, y: height * 0.85))
            }
            .trim(from: 0, to: progress)
            .stroke(
                Color(red: 0.68, green: 0.12, blue: 0.14),
                style: StrokeStyle(lineWidth: 4, lineCap: .round, lineJoin: .round)
            )
        }
    }
}
