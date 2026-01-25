import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Sheet for adding an entry to a challenge
public struct AddEntrySheet: View {
    let challenge: Challenge
    let onSave: () -> Void
    let onCancel: () -> Void
    
    // Simple mode state
    @State private var count: Int = 1
    
    // Sets mode state
    @State private var sets: [Int] = [1]
    
    @State private var selectedDate: Date = Date()
    @State private var note: String = ""
    @State private var selectedFeeling: Feeling?
    @State private var isSaving = false
    @State private var errorMessage: String?
    @State private var showSuccess = false
    
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    
    // Cached formatter for performance
    private static let dateFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter
    }()
    
    public init(
        challenge: Challenge,
        onSave: @escaping () -> Void,
        onCancel: @escaping () -> Void
    ) {
        self.challenge = challenge
        self.onSave = onSave
        self.onCancel = onCancel
    }
    
    private var isSetsBased: Bool {
        challenge.countType == .sets
    }
    
    private var totalCount: Int {
        isSetsBased ? sets.reduce(0, +) : count
    }
    
    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: TallySpacing.xl) {
                    // Tally preview
                    tallyPreview
                    
                    // Count input (mode-specific)
                    if isSetsBased {
                        setsSection
                    } else {
                        countSection
                        quickAddButtons
                    }
                    
                    // Date picker
                    dateSection
                    
                    // Feeling selector
                    feelingSection
                    
                    // Note input
                    noteSection
                    
                    // Error message
                    if let error = errorMessage {
                        Text(error)
                            .font(.tallyLabelSmall)
                            .foregroundColor(.red)
                    }
                }
                .tallyPadding()
            }
            .background(Color.tallyPaper)
            .navigationTitle("Add Entry")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        onCancel()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        Task { await saveEntry() }
                    }
                    .fontWeight(.semibold)
                    .disabled(isSaving || totalCount < 1)
                }
            }
            .overlay {
                if showSuccess {
                    successOverlay
                }
            }
            .accessibilityIdentifier("addEntrySheet")
        }
    }
    
    // MARK: - Tally Preview
    
    private var tallyPreview: some View {
        VStack(spacing: TallySpacing.md) {
            TallyMarkView(
                count: totalCount,
                animated: !reduceMotion,
                size: 80
            )
            
            Text("\(totalCount) \(challenge.resolvedUnitLabel)")
                .font(.tallyMonoDisplay)
                .foregroundColor(Color.tallyInk)
            
            if isSetsBased {
                Text("\(sets.count) set\(sets.count == 1 ? "" : "s")")
                    .font(.tallyLabelMedium)
                    .foregroundColor(Color.tallyInkSecondary)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, TallySpacing.xl)
        .background(Color.tallyPaperTint)
        .cornerRadius(16)
    }
    
    // MARK: - Sets Section
    
    private var setsSection: some View {
        VStack(spacing: TallySpacing.md) {
            Text("Sets")
                .font(.tallyLabelMedium)
                .foregroundColor(Color.tallyInkSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            ForEach(Array(sets.enumerated()), id: \.offset) { index, setCount in
                setCard(index: index, count: setCount)
            }
            
            // Add set button
            Button {
                // Use last set value as initial for new set
                let lastValue = sets.last ?? challenge.resolvedDefaultIncrement
                sets.append(lastValue)
            } label: {
                HStack {
                    Image(systemName: "plus.circle.fill")
                    Text("Add Set")
                }
                .font(.tallyLabelMedium)
                .foregroundColor(Color.tallyAccent)
                .frame(maxWidth: .infinity)
                .padding(.vertical, TallySpacing.md)
                .background(Color.tallyPaperTint)
                .cornerRadius(12)
            }
            .accessibilityIdentifier("addSetButton")
        }
    }
    
    private func setCard(index: Int, count: Int) -> some View {
        VStack(spacing: TallySpacing.sm) {
            // Header with set number and remove button
            HStack {
                Text("Set \(index + 1)")
                    .font(.tallyLabelMedium)
                    .foregroundColor(Color.tallyInk)
                
                Spacer()
                
                if sets.count > 1 {
                    Button {
                        sets.remove(at: index)
                    } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundColor(Color.tallyInkTertiary)
                    }
                    .accessibilityLabel("Remove set \(index + 1)")
                }
            }
            
            // Count display
            Text("\(count)")
                .font(.tallyMonoDisplay)
                .foregroundColor(Color.tallyInk)
            
            // -10/-1/+1/+10 buttons
            HStack(spacing: TallySpacing.sm) {
                setButton("-10", index: index, increment: -10, enabled: sets[index] > 10)
                setButton("-1", index: index, increment: -1, enabled: sets[index] > 1)
                setButton("+1", index: index, increment: 1, enabled: true)
                setButton("+10", index: index, increment: 10, enabled: true)
            }
        }
        .padding(TallySpacing.md)
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
        .accessibilityIdentifier("setCard\(index)")
    }
    
    private func setButton(_ title: String, index: Int, increment: Int, enabled: Bool) -> some View {
        Button {
            sets[index] = max(1, sets[index] + increment)
        } label: {
            Text(title)
                .font(.tallyLabelMedium)
                .fontWeight(.medium)
                .frame(maxWidth: .infinity)
                .padding(.vertical, TallySpacing.sm)
                .background(enabled ? Color.tallyPaper : Color.tallyPaper.opacity(0.5))
                .foregroundColor(enabled ? Color.tallyInk : Color.tallyInkTertiary)
                .cornerRadius(8)
        }
        .disabled(!enabled)
    }
    
    // MARK: - Count Section (Simple mode)
    
    private var countSection: some View {
        VStack(spacing: TallySpacing.sm) {
            Text("Count")
                .font(.tallyLabelMedium)
                .foregroundColor(Color.tallyInkSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            HStack(spacing: TallySpacing.lg) {
                Button {
                    if count > 1 { count -= 1 }
                } label: {
                    Image(systemName: "minus.circle.fill")
                        .font(.system(size: 44))
                        .foregroundColor(count > 1 ? Color.tallyAccent : Color.tallyInkTertiary)
                }
                .disabled(count <= 1)
                .accessibilityIdentifier("decrementButton")
                
                TextField("", value: $count, format: .number)
                    .font(.tallyMonoDisplay)
                    .multilineTextAlignment(.center)
                    .keyboardType(.numberPad)
                    .frame(width: 100)
                    .padding(.vertical, TallySpacing.sm)
                    .background(Color.tallyPaperTint)
                    .cornerRadius(8)
                    .accessibilityIdentifier("countInput")
                
                Button {
                    count += 1
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .font(.system(size: 44))
                        .foregroundColor(Color.tallyAccent)
                }
                .accessibilityIdentifier("incrementButton")
            }
            .frame(maxWidth: .infinity)
        }
    }
    
    // MARK: - Quick Add Buttons
    
    private var quickAddButtons: some View {
        VStack(spacing: TallySpacing.sm) {
            HStack(spacing: TallySpacing.md) {
                quickButton("+1", increment: 1)
                quickButton("+10", increment: 10)
                quickButton("+100", increment: 100)
            }
            HStack(spacing: TallySpacing.md) {
                quickButton("-1", increment: -1, enabled: count > 1)
                quickButton("-10", increment: -10, enabled: count > 10)
                quickButton("-100", increment: -100, enabled: count > 100)
            }
        }
    }
    
    private func quickButton(_ title: String, increment: Int, enabled: Bool = true) -> some View {
        Button {
            count = max(1, count + increment)
        } label: {
            Text(title)
                .font(.tallyLabelMedium)
                .fontWeight(.medium)
                .frame(maxWidth: .infinity)
                .padding(.vertical, TallySpacing.sm)
                .background(enabled ? Color.tallyPaperTint : Color.tallyPaperTint.opacity(0.5))
                .foregroundColor(enabled ? Color.tallyInk : Color.tallyInkTertiary)
                .cornerRadius(8)
        }
        .disabled(!enabled)
    }
    
    // MARK: - Date Section
    
    private var dateSection: some View {
        VStack(spacing: TallySpacing.sm) {
            Text("Date")
                .font(.tallyLabelMedium)
                .foregroundColor(Color.tallyInkSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            DatePicker(
                "",
                selection: $selectedDate,
                in: ...Date(),
                displayedComponents: .date
            )
            .datePickerStyle(.compact)
            .labelsHidden()
            .frame(maxWidth: .infinity, alignment: .leading)
            .accessibilityIdentifier("datePicker")
        }
    }
    
    // MARK: - Feeling Section
    
    private var feelingSection: some View {
        VStack(spacing: TallySpacing.sm) {
            Text("How did it feel?")
                .font(.tallyLabelMedium)
                .foregroundColor(Color.tallyInkSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            HStack(spacing: TallySpacing.md) {
                feelingButton(.great, emoji: "🔥", label: "Great")
                feelingButton(.good, emoji: "😊", label: "Good")
                feelingButton(.okay, emoji: "😐", label: "Okay")
                feelingButton(.tough, emoji: "😤", label: "Tough")
            }
        }
    }
    
    private func feelingButton(_ feeling: Feeling, emoji: String, label: String) -> some View {
        Button {
            if selectedFeeling == feeling {
                selectedFeeling = nil
            } else {
                selectedFeeling = feeling
            }
        } label: {
            VStack(spacing: 4) {
                Text(emoji)
                    .font(.system(size: 28))
                Text(label)
                    .font(.tallyLabelSmall)
                    .foregroundColor(selectedFeeling == feeling ? Color.tallyInk : Color.tallyInkSecondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, TallySpacing.sm)
            .background(selectedFeeling == feeling ? Color.tallyAccent.opacity(0.2) : Color.tallyPaperTint)
            .cornerRadius(12)
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(selectedFeeling == feeling ? Color.tallyAccent : Color.clear, lineWidth: 2)
            )
        }
        .accessibilityIdentifier("feeling\(feeling.rawValue.capitalized)")
    }
    
    // MARK: - Note Section
    
    private var noteSection: some View {
        VStack(spacing: TallySpacing.sm) {
            Text("Note (optional)")
                .font(.tallyLabelMedium)
                .foregroundColor(Color.tallyInkSecondary)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            TextField("Add a note...", text: $note, axis: .vertical)
                .lineLimit(3...6)
                .padding(TallySpacing.md)
                .background(Color.tallyPaperTint)
                .cornerRadius(12)
                .accessibilityIdentifier("noteInput")
        }
    }
    
    // MARK: - Success Overlay
    
    private var successOverlay: some View {
        VStack(spacing: TallySpacing.lg) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 64))
                .foregroundColor(.green)
            
            Text("Entry Added!")
                .font(.tallyTitleMedium)
                .foregroundColor(Color.tallyInk)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color.tallyPaper.opacity(0.95))
        .transition(.opacity)
    }
    
    // MARK: - Actions
    
    private func saveEntry() async {
        guard totalCount >= 1 else {
            errorMessage = "Count must be at least 1"
            return
        }
        
        isSaving = true
        errorMessage = nil
        
        do {
            let dateString = Self.dateFormatter.string(from: selectedDate)
            
            let request = CreateEntryRequest(
                challengeId: challenge.id,
                date: dateString,
                count: totalCount,
                sets: isSetsBased ? sets : nil,
                note: note.isEmpty ? nil : note,
                feeling: selectedFeeling
            )
            
            _ = try await APIClient.shared.createEntry(request)
            
            // Show success briefly then dismiss
            withAnimation {
                showSuccess = true
            }
            
            try? await Task.sleep(nanoseconds: 800_000_000)
            
            onSave()
        } catch {
            errorMessage = "Failed to save entry. Please try again."
            print("[AddEntrySheet] Error saving entry: \(error)")
        }
        
        isSaving = false
    }
}

#Preview("Simple Mode") {
    AddEntrySheet(
        challenge: Challenge(
            id: "1",
            userId: "user1",
            name: "Read 100 Books",
            target: 100,
            timeframeType: .year,
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            color: "#D94343",
            icon: "book.fill",
            isPublic: false,
            isArchived: false,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z"
        ),
        onSave: {},
        onCancel: {}
    )
}

#Preview("Sets Mode") {
    AddEntrySheet(
        challenge: Challenge(
            id: "2",
            userId: "user1",
            name: "Push-ups",
            target: 10000,
            timeframeType: .year,
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            color: "#3B82F6",
            icon: "dumbbell.fill",
            isPublic: false,
            isArchived: false,
            countType: .sets,
            unitLabel: "reps",
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z"
        ),
        onSave: {},
        onCancel: {}
    )
}
