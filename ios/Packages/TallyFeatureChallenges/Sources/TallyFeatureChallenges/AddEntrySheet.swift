import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Sheet for adding a new entry with sets/reps support
/// First set defaults to average of first sets over last 10 days
/// Subsequent sets copy previous set value
public struct AddEntrySheet: View {
    let challenge: Challenge
    let recentEntries: [Entry]
    let onSubmit: (CreateEntryRequest) -> Void
    let onDismiss: () -> Void
    
    @State private var sets: [String] = ["1"]
    @State private var simpleCount: String = "1"
    @State private var date: Date = Date()
    @State private var note: String = ""
    @State private var feeling: Feeling?
    @State private var showOptions = false
    @State private var showSuccess = false
    
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    
    private let feelings: [(Feeling, String, String)] = [
        (.great, "Great", "🔥"),
        (.good, "Good", "😊"),
        (.okay, "Okay", "😐"),
        (.tough, "Tough", "😤"),
    ]
    
    public init(
        challenge: Challenge,
        recentEntries: [Entry] = [],
        onSubmit: @escaping (CreateEntryRequest) -> Void,
        onDismiss: @escaping () -> Void
    ) {
        self.challenge = challenge
        self.recentEntries = recentEntries
        self.onSubmit = onSubmit
        self.onDismiss = onDismiss
    }
    
    private var countType: CountType {
        challenge.resolvedCountType
    }
    
    private var unitLabel: String {
        challenge.resolvedUnitLabel
    }
    
    /// Calculate the average first-set value from recent entries
    private var averageFirstSet: Int {
        EntryDefaults.calculateInitialValue(entries: recentEntries, countType: .sets)
    }
    
    private var setsTotal: Int {
        sets.reduce(0) { $0 + (Int($1) ?? 0) }
    }
    
    private var displayCount: Int {
        countType == .sets ? setsTotal : (Int(simpleCount) ?? 0)
    }
    
    private var today: Date { Date() }
    private var isFutureDate: Bool { date > today }
    
    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: TallySpacing.lg) {
                    // Count input
                    if countType == .sets {
                        setsInputSection
                    } else {
                        simpleInputSection
                    }
                    
                    // Options toggle
                    optionsToggle
                    
                    if showOptions {
                        optionsSection
                    }
                    
                    // Date picker
                    dateSection
                    
                    // Submit button
                    submitButton
                }
                .tallyPadding()
            }
            .accessibilityIdentifier("addEntrySheet")
            .background(Color.tallyPaper)
            .navigationTitle("Add Entry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { onDismiss() }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Add") { submit() }
                        .disabled(isFutureDate || displayCount <= 0)
                        .accessibilityIdentifier("addEntryNavButton")
                }
            }
            .onAppear {
                initializeDefaults()
            }
            .onChange(of: countType) { _, _ in
                initializeDefaults()
            }
        }
    }
    
    // MARK: - Initialize Defaults
    
    private func initializeDefaults() {
        showSuccess = false
        if countType == .sets {
            sets = [String(averageFirstSet)]
        } else {
            simpleCount = String(EntryDefaults.calculateInitialValue(entries: recentEntries, countType: .simple))
        }
        date = Date()
        note = ""
        feeling = nil
        showOptions = false
    }
    
    // MARK: - Sets Input Section
    
    private var setsInputSection: some View {
        VStack(spacing: TallySpacing.md) {
            Text("Sets & \(unitLabel)")
                .font(.tallyLabelMedium)
                .foregroundColor(Color.tallyInkSecondary)
            
            ForEach(Array(sets.enumerated()), id: \.offset) { index, setVal in
                setRow(index: index, value: setVal)
            }
            
            // Add set button
            Button {
                addSet()
            } label: {
                HStack {
                    Image(systemName: "plus")
                    Text("Add Set")
                }
                .font(.tallyLabelMedium)
                .foregroundColor(Color.tallyInkSecondary)
            }
            .frame(maxWidth: .infinity)
            .tallyPadding(.vertical, TallySpacing.sm)
            .background(Color.tallyPaperTint)
            .cornerRadius(8)
            
            // Total display with tally
            HStack(spacing: TallySpacing.lg) {
                VStack(spacing: TallySpacing.xs) {
                    Text("\(setsTotal)")
                        .font(.tallyMonoDisplay)
                        .foregroundColor(Color.tallyInk)
                    Text(unitLabel)
                        .font(.tallyLabelSmall)
                        .foregroundColor(Color.tallyInkSecondary)
                }
                
                TallyMarkView(
                    count: setsTotal,
                    animated: !reduceMotion,
                    size: 60
                )
            }
            .tallyPadding(.top, TallySpacing.sm)
        }
    }
    
    private func setRow(index: Int, value: String) -> some View {
        VStack(spacing: TallySpacing.sm) {
            HStack {
                Text("Set \(index + 1)")
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkSecondary)
                
                Spacer()
                
                if sets.count > 1 {
                    Button("Remove") {
                        removeSet(at: index)
                    }
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkSecondary)
                }
            }
            
            HStack(spacing: TallySpacing.sm) {
                setAdjustButton("-10", index: index, delta: -10, enabled: (Int(sets[index]) ?? 0) > 10)
                setAdjustButton("-1", index: index, delta: -1, enabled: (Int(sets[index]) ?? 0) > 1)
                
                TextField("0", text: Binding(
                    get: { sets[index] },
                    set: { sets[index] = $0 }
                ))
                .keyboardType(.numberPad)
                .font(.tallyMonoBody)
                .multilineTextAlignment(.center)
                .frame(width: 70, height: 44)
                .background(Color.tallyPaper)
                .cornerRadius(10)
                .accessibilityIdentifier("countInput")
                
                setAdjustButton("+1", index: index, delta: 1, enabled: true)
                setAdjustButton("+10", index: index, delta: 10, enabled: true)
            }
        }
        .tallyPadding(.horizontal, TallySpacing.sm)
        .tallyPadding(.vertical, TallySpacing.sm)
        .background(Color.tallyPaperTint.opacity(0.5))
        .cornerRadius(10)
    }
    
    private func addSet() {
        // New set defaults to the previous set's value
        let previousValue = sets.last ?? "1"
        sets.append(previousValue)
    }
    
    private func removeSet(at index: Int) {
        guard sets.count > 1 else { return }
        sets.remove(at: index)
    }
    
    private func incrementSet(index: Int, by delta: Int) {
        let current = Int(sets[index]) ?? 0
        sets[index] = String(max(0, current + delta))
    }
    
    private func setAdjustButton(_ title: String, index: Int, delta: Int, enabled: Bool) -> some View {
        Button {
            incrementSet(index: index, by: delta)
        } label: {
            Text(title)
                .font(.tallyLabelSmall)
                .frame(width: 44, height: 32)
                .background(enabled ? Color.tallyPaperTint : Color.tallyPaperTint.opacity(0.4))
                .foregroundColor(enabled ? Color.tallyInk : Color.tallyInkTertiary)
                .cornerRadius(8)
        }
        .disabled(!enabled)
    }
    
    // MARK: - Simple Count Input
    
    private var simpleInputSection: some View {
        VStack(spacing: TallySpacing.md) {
            Text("How many \(unitLabel)?")
                .font(.tallyLabelMedium)
                .foregroundColor(Color.tallyInkSecondary)
            
            // Decrement buttons row
            HStack(spacing: TallySpacing.sm) {
                Button { incrementSimple(by: -100) } label: {
                    Text("−100")
                        .font(.tallyLabelSmall)
                }
                .buttonStyle(IncrementButtonStyle())
                .accessibilityIdentifier("decrementButton")
                
                Button { incrementSimple(by: -10) } label: {
                    Text("−10")
                        .font(.tallyLabelSmall)
                }
                .buttonStyle(IncrementButtonStyle())
                
                Button { incrementSimple(by: -1) } label: {
                    Text("−1")
                        .font(.tallyLabelMedium)
                }
                .buttonStyle(IncrementButtonStyle())
            }
            
            // Main input
            TextField("0", text: $simpleCount)
                .keyboardType(.numberPad)
                .font(.system(size: 48, weight: .semibold, design: .monospaced))
                .multilineTextAlignment(.center)
                .frame(width: 140, height: 60)
                .accessibilityIdentifier("countInput")
            
            // Increment buttons row
            HStack(spacing: TallySpacing.sm) {
                Button { incrementSimple(by: 1) } label: {
                    Text("+1")
                        .font(.tallyLabelMedium)
                }
                .buttonStyle(IncrementButtonStyle())
                
                Button { incrementSimple(by: 10) } label: {
                    Text("+10")
                        .font(.tallyLabelSmall)
                }
                .buttonStyle(IncrementButtonStyle())
                
                Button { incrementSimple(by: 100) } label: {
                    Text("+100")
                        .font(.tallyLabelSmall)
                }
                .buttonStyle(IncrementButtonStyle())
                .accessibilityIdentifier("incrementButton")
            }
            
            // Tally preview
            TallyMarkView(
                count: Int(simpleCount) ?? 0,
                animated: !reduceMotion,
                size: 60
            )
        }
    }
    
    private func incrementSimple(by delta: Int) {
        let current = Int(simpleCount) ?? 0
        simpleCount = String(max(0, current + delta))
    }
    
    // MARK: - Date Section
    
    private var dateSection: some View {
        HStack {
            Text("Date")
                .font(.tallyLabelMedium)
                .foregroundColor(Color.tallyInkSecondary)
            
            Spacer()
            
            DatePicker(
                "",
                selection: $date,
                in: ...today,
                displayedComponents: .date
            )
            .labelsHidden()
            .accessibilityIdentifier("datePicker")
        }
        .tallyPadding()
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
    }
    
    // MARK: - Options Section
    
    private var optionsToggle: some View {
        Button {
            withAnimation(.easeInOut(duration: 0.2)) {
                showOptions.toggle()
            }
        } label: {
            HStack {
                Text("More options")
                    .font(.tallyLabelMedium)
                    .foregroundColor(Color.tallyInkSecondary)
                
                Spacer()
                
                Image(systemName: "chevron.down")
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(Color.tallyInkSecondary)
                    .rotationEffect(.degrees(showOptions ? 180 : 0))
            }
        }
    }
    
    private var optionsSection: some View {
        VStack(spacing: TallySpacing.md) {
            // Feeling selector
            VStack(alignment: .leading, spacing: TallySpacing.sm) {
                Text("How did it feel?")
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkSecondary)
                
                HStack(spacing: TallySpacing.sm) {
                    ForEach(feelings, id: \.0) { feelingOption, label, emoji in
                        Button {
                            feeling = feeling == feelingOption ? nil : feelingOption
                        } label: {
                            VStack(spacing: 2) {
                                Text(emoji)
                                    .font(.system(size: 24))
                                Text(label)
                                    .font(.tallyLabelSmall)
                            }
                            .frame(maxWidth: .infinity)
                            .tallyPadding(.vertical, TallySpacing.sm)
                            .background(
                                feeling == feelingOption
                                    ? Color.tallyAccent.opacity(0.1)
                                    : Color.tallyPaperTint
                            )
                            .cornerRadius(8)
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(
                                        feeling == feelingOption
                                            ? Color.tallyAccent
                                            : Color.clear,
                                        lineWidth: 2
                                    )
                            )
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier(feelingIdentifier(feelingOption))
                    }
                }
            }
            
            // Note input
            VStack(alignment: .leading, spacing: TallySpacing.xs) {
                Text("Note")
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkSecondary)
                
                TextField("Any thoughts...", text: $note, axis: .vertical)
                    .font(.tallyBodyMedium)
                    .lineLimit(2...4)
                    .tallyPadding()
                    .background(Color.tallyPaperTint)
                    .cornerRadius(8)
                    .accessibilityIdentifier("noteInput")
            }
        }
    }
    
    // MARK: - Submit Button
    
    private var submitButton: some View {
        Button {
            submit()
        } label: {
            HStack(spacing: TallySpacing.sm) {
                if showSuccess {
                    Image(systemName: "checkmark")
                }
                Text(showSuccess ? "Added!" : "Add \(displayCount) \(unitLabel)")
            }
            .font(.tallyTitleSmall)
            .foregroundColor(.white)
            .frame(maxWidth: .infinity)
            .tallyPadding()
            .background(showSuccess ? Color.tallySuccess : Color.tallyAccent)
            .cornerRadius(12)
        }
        .disabled(isFutureDate || displayCount <= 0)
        .opacity((isFutureDate || displayCount <= 0) ? 0.5 : 1)
        .accessibilityIdentifier("saveEntryButton")
    }
    
    // MARK: - Submit
    
    private func submit() {
        guard !isFutureDate, displayCount > 0 else { return }
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let dateString = dateFormatter.string(from: date)
        
        let numericSets: [Int]? = countType == .sets
            ? sets.compactMap { Int($0) }.filter { $0 > 0 }
            : nil
        
        let request = CreateEntryRequest(
            challengeId: challenge.id,
            date: dateString,
            count: displayCount,
            sets: numericSets,
            note: note.isEmpty ? nil : note,
            feeling: feeling
        )
        
        // Optimistic save - call synchronously and dismiss after a brief confirmation
        onSubmit(request)
        showSuccess = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
            onDismiss()
        }
    }

    private func feelingIdentifier(_ feeling: Feeling) -> String {
        switch feeling {
        case .great: return "feelingGreat"
        case .good: return "feelingGood"
        case .okay: return "feelingOkay"
        case .tough: return "feelingTough"
        }
    }
}

// MARK: - Increment Button Style

private struct IncrementButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundColor(configuration.isPressed ? Color.tallyInk : Color.tallyInkSecondary)
            .frame(width: 52, height: 36)
            .background(Color.tallyPaperTint)
            .cornerRadius(8)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
    }
}

// MARK: - Preview

#Preview("Sets Mode") {
    AddEntrySheet(
        challenge: Challenge(
            id: "1",
            userId: "user1",
            name: "Push-ups",
            target: 10000,
            timeframeType: .year,
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            color: "#D94343",
            icon: "figure.strengthtraining.traditional",
            isPublic: false,
            isArchived: false,
            countType: .sets,
            unitLabel: "reps",
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z"
        ),
        recentEntries: [
            Entry(
                id: "e1",
                userId: "user1",
                challengeId: "1",
                date: "2026-01-26",
                count: 75,
                sets: [25, 25, 25],
                createdAt: "2026-01-26T10:00:00Z",
                updatedAt: "2026-01-26T10:00:00Z"
            ),
            Entry(
                id: "e2",
                userId: "user1",
                challengeId: "1",
                date: "2026-01-25",
                count: 60,
                sets: [20, 20, 20],
                createdAt: "2026-01-25T10:00:00Z",
                updatedAt: "2026-01-25T10:00:00Z"
            ),
        ],
        onSubmit: { _ in },
        onDismiss: {}
    )
}

#Preview("Simple Mode") {
    AddEntrySheet(
        challenge: Challenge(
            id: "2",
            userId: "user1",
            name: "Read Books",
            target: 100,
            timeframeType: .year,
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            color: "#4B5563",
            icon: "book.fill",
            isPublic: false,
            isArchived: false,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z"
        ),
        onSubmit: { _ in },
        onDismiss: {}
    )
}
