import SwiftUI

struct CreateChallengeView: View {
    @Environment(\.dismiss) private var dismiss
    let onSave: (Challenge) -> Void
    
    @State private var name = ""
    @State private var targetNumber = ""
    @State private var selectedColor = "#3B82F6"
    @State private var selectedIcon = "📚"
    @State private var isPublic = false
    
    private let colors = [
        "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"
    ]
    
    private let icons = ["📚", "🏃", "💪", "🧘", "🎨", "🎵", "✍️", "🚴", "🏊", "⚽"]
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Challenge Details") {
                    TextField("Name", text: $name)
                    TextField("Target", text: $targetNumber)
                        .keyboardType(.numberPad)
                }
                
                Section("Appearance") {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Icon")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 5), spacing: 12) {
                            ForEach(icons, id: \.self) { icon in
                                Text(icon)
                                    .font(.title2)
                                    .padding(8)
                                    .background(
                                        selectedIcon == icon
                                            ? Color.accentColor.opacity(0.2)
                                            : Color.clear
                                    )
                                    .clipShape(Circle())
                                    .onTapGesture { selectedIcon = icon }
                            }
                        }
                    }
                    
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Color")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        HStack(spacing: 12) {
                            ForEach(colors, id: \.self) { color in
                                Circle()
                                    .fill(Color(hex: color))
                                    .frame(width: 36, height: 36)
                                    .overlay {
                                        if selectedColor == color {
                                            Circle()
                                                .stroke(Color.white, lineWidth: 3)
                                        }
                                    }
                                    .onTapGesture { selectedColor = color }
                            }
                        }
                    }
                }
                
                Section {
                    Toggle("Make Public", isOn: $isPublic)
                }
            }
            .navigationTitle("New Challenge")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Create") {
                        guard !name.isEmpty, let target = Int(targetNumber) else { return }
                        let challenge = Challenge(
                            id: UUID().uuidString,
                            name: name,
                            targetNumber: target,
                            currentCount: 0,
                            color: selectedColor,
                            icon: selectedIcon,
                            year: Calendar.current.component(.year, from: Date()),
                            isPublic: isPublic,
                            daysLeft: daysLeftInYear()
                        )
                        onSave(challenge)
                    }
                    .disabled(name.isEmpty || targetNumber.isEmpty)
                }
            }
        }
    }
    
    private func daysLeftInYear() -> Int {
        let calendar = Calendar.current
        let today = Date()
        let year = calendar.component(.year, from: today)
        guard let endOfYear = calendar.date(from: DateComponents(year: year, month: 12, day: 31)) else {
            return 365
        }
        return calendar.dateComponents([.day], from: today, to: endOfYear).day ?? 365
    }
}

#Preview {
    CreateChallengeView(onSave: { _ in })
}
