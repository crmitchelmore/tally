import SwiftUI

struct CreateChallengeView: View {
    let onSave: (String, Int, String, String) -> Void
    
    @State private var name = ""
    @State private var targetNumber = 100
    @State private var selectedColor = "#3B82F6"
    @State private var selectedIcon = "📚"
    
    @Environment(\.dismiss) private var dismiss
    
    let colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"]
    let icons = ["📚", "🏃", "💪", "🧘", "✍️", "🎯", "🚴", "🏊", "⚽️", "🎸"]
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Challenge Details") {
                    TextField("Name", text: $name)
                    
                    Stepper("Target: \(targetNumber)", value: $targetNumber, in: 1...10000, step: 10)
                }
                
                Section("Color") {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 6), spacing: 12) {
                        ForEach(colors, id: \.self) { color in
                            Circle()
                                .fill(Color(hex: color))
                                .frame(width: 40, height: 40)
                                .overlay {
                                    if selectedColor == color {
                                        Image(systemName: "checkmark")
                                            .foregroundColor(.white)
                                            .fontWeight(.bold)
                                    }
                                }
                                .onTapGesture {
                                    selectedColor = color
                                }
                        }
                    }
                }
                
                Section("Icon") {
                    LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 5), spacing: 12) {
                        ForEach(icons, id: \.self) { icon in
                            Text(icon)
                                .font(.title)
                                .frame(width: 44, height: 44)
                                .background(selectedIcon == icon ? Color.accentColor.opacity(0.2) : Color.clear)
                                .clipShape(RoundedRectangle(cornerRadius: 8))
                                .onTapGesture {
                                    selectedIcon = icon
                                }
                        }
                    }
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
                        onSave(name, targetNumber, selectedColor, selectedIcon)
                    }
                    .disabled(name.isEmpty)
                }
            }
        }
    }
}

#Preview {
    CreateChallengeView { _, _, _, _ in }
}
