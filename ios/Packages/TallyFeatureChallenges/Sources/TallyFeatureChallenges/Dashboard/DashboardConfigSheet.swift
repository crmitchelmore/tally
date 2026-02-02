import SwiftUI
import UniformTypeIdentifiers
import TallyDesign
import TallyFeatureAPIClient

/// Dashboard panel configuration sheet
public struct DashboardConfigSheet: View {
    let config: DashboardConfig
    let onChange: (DashboardConfig) -> Void
    
    @Environment(\.dismiss) private var dismiss
    @State private var localConfig: DashboardConfig
    @State private var draggingPanel: DashboardPanel?
    
    public init(config: DashboardConfig, onChange: @escaping (DashboardConfig) -> Void) {
        self.config = config
        self.onChange = onChange
        _localConfig = State(initialValue: config)
    }
    
    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: TallySpacing.lg) {
                    visiblePanelSection
                    hiddenPanelSection
                }
                .tallyPadding()
            }
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

    private var visiblePanelSection: some View {
        VStack(alignment: .leading, spacing: TallySpacing.sm) {
            Text("Visible Panels")
                .font(.tallyTitleSmall)
                .foregroundColor(Color.tallyInk)
            
            if localConfig.visiblePanels.isEmpty {
                Text("No visible panels yet")
                    .font(.tallyBodySmall)
                    .foregroundColor(Color.tallyInkTertiary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, TallySpacing.md)
            } else {
                ForEach(localConfig.visiblePanels) { panel in
                    PanelRow(panel: panel)
                        .onDrag {
                            draggingPanel = panel
                            return NSItemProvider(object: panel.rawValue as NSString)
                        }
                        .onDrop(
                            of: [UTType.text],
                            delegate: PanelDropDelegate(
                                panel: panel,
                                panels: $localConfig.visiblePanels,
                                draggingPanel: $draggingPanel
                            )
                        )
                }
            }
        }
        .onDrop(of: [UTType.text], isTargeted: nil) { _ in
            guard let draggingPanel else { return false }
            moveToVisible(draggingPanel)
            self.draggingPanel = nil
            return true
        }
        .tallyPadding()
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
    }

    private var hiddenPanelSection: some View {
        VStack(alignment: .leading, spacing: TallySpacing.sm) {
            Text("Hidden Panels")
                .font(.tallyTitleSmall)
                .foregroundColor(Color.tallyInk)
            
            if localConfig.hiddenPanels.isEmpty {
                Text("All panels are visible")
                    .font(.tallyBodySmall)
                    .foregroundColor(Color.tallyInkTertiary)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, TallySpacing.md)
            } else {
                ForEach(localConfig.hiddenPanels) { panel in
                    HiddenPanelRow(panel: panel)
                        .onDrag {
                            draggingPanel = panel
                            return NSItemProvider(object: panel.rawValue as NSString)
                        }
                        .onDrop(
                            of: [UTType.text],
                            delegate: PanelDropDelegate(
                                panel: panel,
                                panels: $localConfig.hiddenPanels,
                                draggingPanel: $draggingPanel
                            )
                        )
                }
            }
        }
        .onDrop(of: [UTType.text], isTargeted: nil) { _ in
            guard let draggingPanel else { return false }
            moveToHidden(draggingPanel)
            self.draggingPanel = nil
            return true
        }
        .tallyPadding()
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
    }
    
    private func moveToVisible(_ panel: DashboardPanel) {
        guard let index = localConfig.hiddenPanels.firstIndex(of: panel) else { return }
        localConfig.hiddenPanels.remove(at: index)
        localConfig.visiblePanels.append(panel)
    }
    
    private func moveToHidden(_ panel: DashboardPanel) {
        guard let index = localConfig.visiblePanels.firstIndex(of: panel) else { return }
        localConfig.visiblePanels.remove(at: index)
        localConfig.hiddenPanels.append(panel)
    }
}

// MARK: - Panel Row

private struct PanelRow: View {
    let panel: DashboardPanel
    
    var body: some View {
        HStack(spacing: TallySpacing.sm) {
            Image(systemName: "line.3.horizontal")
                .font(.system(size: 14))
                .foregroundColor(Color.tallyInkTertiary)
            
            Text(panel.title)
                .font(.tallyLabelMedium)
                .foregroundColor(Color.tallyInk)
            
            Spacer()
        }
        .padding(.vertical, TallySpacing.md)
        .contentShape(Rectangle())
    }
}

// MARK: - Hidden Panel Row

private struct HiddenPanelRow: View {
    let panel: DashboardPanel
    
    var body: some View {
        HStack(spacing: TallySpacing.sm) {
            Image(systemName: "line.3.horizontal")
                .font(.system(size: 14))
                .foregroundColor(Color.tallyInkTertiary)
            
            Text(panel.title)
                .font(.tallyLabelMedium)
                .foregroundColor(Color.tallyInkSecondary)
            
            Spacer()
        }
        .padding(.vertical, TallySpacing.md)
        .contentShape(Rectangle())
    }
}

// MARK: - Drag and Drop

private struct PanelDropDelegate: DropDelegate {
    let panel: DashboardPanel
    @Binding var panels: [DashboardPanel]
    @Binding var draggingPanel: DashboardPanel?
    
    func dropEntered(info: DropInfo) {
        guard let draggingPanel, draggingPanel != panel else { return }
        guard let fromIndex = panels.firstIndex(of: draggingPanel),
              let toIndex = panels.firstIndex(of: panel) else { return }
        if panels[toIndex] != draggingPanel {
            withAnimation {
                panels.move(fromOffsets: IndexSet(integer: fromIndex), toOffset: toIndex > fromIndex ? toIndex + 1 : toIndex)
            }
        }
    }
    
    func dropUpdated(info: DropInfo) -> DropProposal? {
        DropProposal(operation: .move)
    }
    
    func performDrop(info: DropInfo) -> Bool {
        draggingPanel = nil
        return true
    }
}

#Preview {
    DashboardConfigSheet(config: .default, onChange: { _ in })
}
