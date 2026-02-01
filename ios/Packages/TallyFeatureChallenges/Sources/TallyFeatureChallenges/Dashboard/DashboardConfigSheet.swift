import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Dashboard panel configuration sheet
public struct DashboardConfigSheet: View {
    let config: DashboardConfig
    let onChange: (DashboardConfig) -> Void
    
    @Environment(\.dismiss) private var dismiss
    @State private var localConfig: DashboardConfig
    
    public init(config: DashboardConfig, onChange: @escaping (DashboardConfig) -> Void) {
        self.config = config
        self.onChange = onChange
        _localConfig = State(initialValue: config)
    }
    
    public var body: some View {
        NavigationStack {
            VStack(spacing: TallySpacing.lg) {
                VStack(alignment: .leading, spacing: TallySpacing.sm) {
                    Text("Show panels")
                        .font(.tallyTitleSmall)
                        .foregroundColor(Color.tallyInk)
                    
                    Toggle("Highlights", isOn: binding(for: \.highlights))
                    Toggle("Personal Records", isOn: binding(for: \.personalRecords))
                    Toggle("Progress Graph", isOn: binding(for: \.progressGraph))
                    Toggle("Goal Progress", isOn: binding(for: \.burnUpChart))
                    Toggle("Sets Stats", isOn: binding(for: \.setsStats))
                }
                .tallyPadding()
                .background(Color.tallyPaperTint)
                .cornerRadius(12)
                
                VStack(alignment: .leading, spacing: TallySpacing.sm) {
                    Text("Panel order")
                        .font(.tallyTitleSmall)
                        .foregroundColor(Color.tallyInk)
                    
                    ForEach(localConfig.order) { panel in
                        HStack {
                            Text(panel.title)
                                .font(.tallyLabelMedium)
                                .foregroundColor(Color.tallyInk)
                            Spacer()
                            Button {
                                move(panel: panel, direction: -1)
                            } label: {
                                Image(systemName: "chevron.up")
                                    .font(.system(size: 12, weight: .semibold))
                            }
                            .buttonStyle(.plain)
                            .foregroundColor(canMove(panel: panel, direction: -1) ? Color.tallyInkSecondary : Color.tallyInkTertiary)
                            .disabled(!canMove(panel: panel, direction: -1))
                            
                            Button {
                                move(panel: panel, direction: 1)
                            } label: {
                                Image(systemName: "chevron.down")
                                    .font(.system(size: 12, weight: .semibold))
                            }
                            .buttonStyle(.plain)
                            .foregroundColor(canMove(panel: panel, direction: 1) ? Color.tallyInkSecondary : Color.tallyInkTertiary)
                            .disabled(!canMove(panel: panel, direction: 1))
                        }
                        .padding(.vertical, TallySpacing.xs)
                    }
                }
                .tallyPadding()
                .background(Color.tallyPaperTint)
                .cornerRadius(12)
                
                Spacer()
            }
            .tallyPadding()
            .navigationTitle("Dashboard Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .onChange(of: localConfig) { _, newValue in
                onChange(newValue)
            }
        }
    }
    
    private func binding(for keyPath: WritableKeyPath<DashboardConfig.Panels, Bool>) -> Binding<Bool> {
        Binding(
            get: { localConfig.panels[keyPath: keyPath] },
            set: { newValue in
                localConfig.panels[keyPath: keyPath] = newValue
            }
        )
    }
    
    private func canMove(panel: DashboardPanel, direction: Int) -> Bool {
        guard let index = localConfig.order.firstIndex(of: panel) else { return false }
        let newIndex = index + direction
        return newIndex >= 0 && newIndex < localConfig.order.count
    }
    
    private func move(panel: DashboardPanel, direction: Int) {
        guard let index = localConfig.order.firstIndex(of: panel) else { return }
        let newIndex = index + direction
        guard newIndex >= 0 && newIndex < localConfig.order.count else { return }
        localConfig.order.swapAt(index, newIndex)
    }
}

#Preview {
    DashboardConfigSheet(config: .default, onChange: { _ in })
}
