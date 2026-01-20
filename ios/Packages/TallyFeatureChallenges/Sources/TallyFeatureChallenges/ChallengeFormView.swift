import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Form for creating or editing a challenge
public struct ChallengeFormView: View {
    @Bindable var manager: ChallengesManager
    
    // Edit mode: existing challenge
    let existingChallenge: Challenge?
    let onSave: () -> Void
    let onCancel: () -> Void
    
    // Form fields
    @State private var name: String = ""
    @State private var target: Int = 100
    @State private var timeframeType: TimeframeType = .year
    @State private var startDate: Date = Date()
    @State private var endDate: Date = Calendar.current.date(byAdding: .year, value: 1, to: Date()) ?? Date()
    @State private var selectedColor: String = "#4B5563"
    @State private var selectedIcon: String = "checkmark"
    @State private var isPublic: Bool = false
    
    @State private var isSaving = false
    @State private var validationError: String?
    
    private let colors: [String] = [
        "#4B5563", // Gray
        "#D94343", // Red (accent)
        "#2563EB", // Blue
        "#16A34A", // Green
        "#9333EA", // Purple
        "#EA580C", // Orange
        "#0891B2", // Teal
        "#CA8A04", // Yellow
    ]
    
    private let icons: [String] = [
        "checkmark",
        "book.fill",
        "figure.run",
        "pencil.and.outline",
        "music.note",
        "paintbrush.fill",
        "cup.and.saucer.fill",
        "dumbbell.fill",
        "heart.fill",
        "star.fill",
        "leaf.fill",
        "brain.head.profile",
    ]
    
    public init(
        manager: ChallengesManager,
        existingChallenge: Challenge? = nil,
        onSave: @escaping () -> Void,
        onCancel: @escaping () -> Void
    ) {
        self.manager = manager
        self.existingChallenge = existingChallenge
        self.onSave = onSave
        self.onCancel = onCancel
    }
    
    public var body: some View {
        NavigationStack {
            Form {
                // Name section
                Section {
                    TextField("Challenge name", text: $name)
                        .font(.tallyBodyMedium)
                } header: {
                    Text("Name")
                }
                
                // Target section
                Section {
                    Stepper(value: $target, in: 1...100000, step: stepAmount) {
                        HStack {
                            Text("Target")
                            Spacer()
                            TextField("Target", value: $target, format: .number)
                                .keyboardType(.numberPad)
                                .multilineTextAlignment(.trailing)
                                .frame(width: 80)
                        }
                    }
                } header: {
                    Text("Target")
                } footer: {
                    Text("How many do you want to complete?")
                }
                
                // Timeframe section
                Section {
                    Picker("Timeframe", selection: $timeframeType) {
                        Text("Year").tag(TimeframeType.year)
                        Text("Month").tag(TimeframeType.month)
                        Text("Custom").tag(TimeframeType.custom)
                    }
                    .pickerStyle(.segmented)
                    .onChange(of: timeframeType) { _, newValue in
                        updateDatesForTimeframe(newValue)
                    }
                    
                    if timeframeType == .custom {
                        DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                        DatePicker("End Date", selection: $endDate, in: startDate..., displayedComponents: .date)
                    } else {
                        HStack {
                            Text("Period")
                            Spacer()
                            Text(periodText)
                                .foregroundColor(Color.tallyInkSecondary)
                        }
                    }
                } header: {
                    Text("Timeframe")
                }
                
                // Appearance section
                Section {
                    // Color picker
                    VStack(alignment: .leading, spacing: TallySpacing.sm) {
                        Text("Color")
                            .font(.tallyLabelMedium)
                            .foregroundColor(Color.tallyInkSecondary)
                        
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 8), spacing: TallySpacing.sm) {
                            ForEach(colors, id: \.self) { color in
                                colorButton(color)
                            }
                        }
                    }
                    
                    // Icon picker
                    VStack(alignment: .leading, spacing: TallySpacing.sm) {
                        Text("Icon")
                            .font(.tallyLabelMedium)
                            .foregroundColor(Color.tallyInkSecondary)
                        
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 6), spacing: TallySpacing.sm) {
                            ForEach(icons, id: \.self) { icon in
                                iconButton(icon)
                            }
                        }
                    }
                } header: {
                    Text("Appearance")
                }
                
                // Visibility section
                Section {
                    Toggle("Public Challenge", isOn: $isPublic)
                } header: {
                    Text("Visibility")
                } footer: {
                    Text(isPublic ? "Anyone can see your progress and cheer you on." : "Only you can see this challenge.")
                }
                
                // Validation error
                if let error = validationError {
                    Section {
                        Text(error)
                            .foregroundColor(Color.tallyError)
                            .font(.tallyLabelMedium)
                    }
                }
            }
            .navigationTitle(isEditing ? "Edit Challenge" : "New Challenge")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel", action: onCancel)
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button(isEditing ? "Save" : "Create") {
                        Task { await save() }
                    }
                    .disabled(!isValid || isSaving)
                    .fontWeight(.semibold)
                }
            }
            .onAppear {
                if let challenge = existingChallenge {
                    populateForm(from: challenge)
                }
            }
        }
    }
    
    // MARK: - Color Button
    
    private func colorButton(_ color: String) -> some View {
        Button {
            selectedColor = color
        } label: {
            Circle()
                .fill(Color(hex: color) ?? Color.gray)
                .frame(width: 32, height: 32)
                .overlay {
                    if selectedColor == color {
                        Image(systemName: "checkmark")
                            .font(.caption.bold())
                            .foregroundColor(.white)
                    }
                }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Color \(color)")
    }
    
    // MARK: - Icon Button
    
    private func iconButton(_ icon: String) -> some View {
        Button {
            selectedIcon = icon
        } label: {
            Image(systemName: icon)
                .font(.title3)
                .frame(width: 44, height: 44)
                .foregroundColor(selectedIcon == icon ? Color.tallyAccent : Color.tallyInkSecondary)
                .background(
                    RoundedRectangle(cornerRadius: 8)
                        .fill(selectedIcon == icon ? Color.tallyAccentSubtle : Color.tallyPaperTint)
                )
        }
        .buttonStyle(.plain)
        .accessibilityLabel(icon)
    }
    
    // MARK: - Helpers
    
    private var isEditing: Bool {
        existingChallenge != nil
    }
    
    private var isValid: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        target > 0 &&
        endDate > startDate
    }
    
    private var stepAmount: Int {
        if target < 10 { return 1 }
        if target < 100 { return 5 }
        if target < 1000 { return 10 }
        return 100
    }
    
    private var periodText: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d, yyyy"
        return "\(formatter.string(from: startDate)) – \(formatter.string(from: endDate))"
    }
    
    private func updateDatesForTimeframe(_ type: TimeframeType) {
        let calendar = Calendar.current
        let now = Date()
        
        switch type {
        case .year:
            // Current year
            let year = calendar.component(.year, from: now)
            startDate = calendar.date(from: DateComponents(year: year, month: 1, day: 1)) ?? now
            endDate = calendar.date(from: DateComponents(year: year, month: 12, day: 31)) ?? now
            
        case .month:
            // Current month
            let components = calendar.dateComponents([.year, .month], from: now)
            startDate = calendar.date(from: components) ?? now
            endDate = calendar.date(byAdding: DateComponents(month: 1, day: -1), to: startDate) ?? now
            
        case .custom:
            // Keep current dates
            break
        }
    }
    
    private func populateForm(from challenge: Challenge) {
        name = challenge.name
        target = challenge.target
        timeframeType = challenge.timeframeType
        selectedColor = challenge.color
        selectedIcon = challenge.icon
        isPublic = challenge.isPublic
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        
        if let start = formatter.date(from: challenge.startDate) {
            startDate = start
        }
        if let end = formatter.date(from: challenge.endDate) {
            endDate = end
        }
    }
    
    private func save() async {
        guard isValid else {
            validationError = "Please fill in all required fields."
            return
        }
        
        isSaving = true
        validationError = nil
        
        if let existing = existingChallenge {
            // Update existing
            await manager.updateChallenge(
                id: existing.id,
                name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                target: target,
                color: selectedColor,
                icon: selectedIcon,
                isPublic: isPublic
            )
        } else {
            // Create new
            await manager.createChallenge(
                name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                target: target,
                timeframeType: timeframeType,
                startDate: startDate,
                endDate: endDate,
                color: selectedColor,
                icon: selectedIcon,
                isPublic: isPublic
            )
        }
        
        isSaving = false
        onSave()
    }
}

#Preview("Create") {
    ChallengeFormView(
        manager: ChallengesManager(),
        onSave: {},
        onCancel: {}
    )
}

#Preview("Edit") {
    ChallengeFormView(
        manager: ChallengesManager(),
        existingChallenge: Challenge(
            id: "1",
            userId: "user1",
            name: "Read 100 Books",
            target: 100,
            timeframeType: .year,
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            color: "#D94343",
            icon: "book.fill",
            isPublic: true,
            isArchived: false,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z"
        ),
        onSave: {},
        onCancel: {}
    )
}
