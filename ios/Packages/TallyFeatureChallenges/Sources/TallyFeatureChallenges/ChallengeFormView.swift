import SwiftUI
import TallyFeatureAPIClient

struct ChallengeFormView: View {
    enum Mode {
        case create
        case edit(Challenge)
    }

    let mode: Mode
    let onSave: @Sendable (ChallengeDraft) async -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var name: String = ""
    @State private var targetNumber: String = ""
    @State private var color: String = "#b21f24"
    @State private var icon: String = "tally"
    @State private var timeframeUnit: String = "year"
    @State private var year: Int = Calendar.current.component(.year, from: Date())
    @State private var startDate: Date = Date()
    @State private var endDate: Date = Date()
    @State private var isPublic: Bool = false

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Basics")) {
                    TextField("Name", text: $name)
                    TextField("Target", text: $targetNumber)
                        .keyboardType(.numberPad)
                    Toggle("Public", isOn: $isPublic)
                }

                Section(header: Text("Timeframe")) {
                    Picker("Unit", selection: $timeframeUnit) {
                        Text("Year").tag("year")
                        Text("Month").tag("month")
                        Text("Custom").tag("custom")
                    }
                    .pickerStyle(.segmented)

                    if timeframeUnit == "year" {
                        Stepper("Year \(year)", value: $year, in: Calendar.current.component(.year, from: Date())...(Calendar.current.component(.year, from: Date()) + 4))
                    } else {
                        DatePicker("Start", selection: $startDate, displayedComponents: .date)
                        DatePicker("End", selection: $endDate, in: startDate..., displayedComponents: .date)
                    }
                }

                Section(header: Text("Style")) {
                    Picker("Color", selection: $color) {
                        ForEach(colorOptions, id: \.self) { value in
                            Text(value).tag(value)
                        }
                    }
                    Picker("Icon", selection: $icon) {
                        ForEach(iconOptions, id: \.self) { value in
                            Text(value).tag(value)
                        }
                    }
                }
            }
            .navigationTitle(modeTitle)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Save") {
                        Task {
                            await onSave(makeDraft())
                            dismiss()
                        }
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || Int(targetNumber) == nil)
                }
            }
        }
        .onAppear(perform: loadFromMode)
    }

    private var modeTitle: String {
        switch mode {
        case .create:
            return "New Challenge"
        case .edit:
            return "Edit Challenge"
        }
    }

    private func loadFromMode() {
        guard case .edit(let challenge) = mode else { return }
        name = challenge.name
        targetNumber = String(challenge.targetNumber)
        color = challenge.color
        icon = challenge.icon
        timeframeUnit = challenge.timeframeUnit
        year = challenge.year
        if let start = parseDate(challenge.startDate) {
            startDate = start
        }
        if let end = parseDate(challenge.endDate) {
            endDate = end
        }
        isPublic = challenge.isPublic
    }

    private func makeDraft() -> ChallengeDraft {
        let targetValue = Int(targetNumber) ?? 1
        let start = timeframeUnit == "year" ? nil : isoDate(startDate)
        let end = timeframeUnit == "year" ? nil : isoDate(endDate)
        let yearValue = timeframeUnit == "year" ? year : Calendar.current.component(.year, from: startDate)
        return ChallengeDraft(
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            targetNumber: max(1, targetValue),
            color: color,
            icon: icon,
            timeframeUnit: timeframeUnit,
            startDate: start,
            endDate: end,
            year: yearValue,
            isPublic: isPublic
        )
    }

    private func isoDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        return formatter.string(from: date)
    }

    private func parseDate(_ iso: String?) -> Date? {
        guard let iso else { return nil }
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        return formatter.date(from: iso)
    }

    private let colorOptions = [
        "#b21f24",
        "#d35b5f",
        "#e0b05b",
        "#2a5b82",
        "#3c7a5a",
        "#1a1a1a"
    ]

    private let iconOptions = [
        "tally",
        "dot",
        "ring",
        "spark",
        "bolt",
        "wave"
    ]
}
