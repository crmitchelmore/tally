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
    @State private var isDraggingOverVisible = false
    @State private var isDraggingOverHidden = false
    
    public init(config: DashboardConfig, onChange: @escaping (DashboardConfig) -> Void) {
        self.config = config
        self.onChange = onChange
        _localConfig = State(initialValue: config)
    }
    
    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: TallySpacing.xl) {
                    instructionText
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
    
    private var instructionText: some View {
        Text("Drag panels to reorder or move between sections")
            .font(.tallyBodySmall)
            .foregroundColor(Color.tallyInkSecondary)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var visiblePanelSection: some View {
        VStack(alignment: .leading, spacing: TallySpacing.md) {
            HStack {
                Image(systemName: "eye.fill")
                    .foregroundColor(Color.tallyAccent)
                Text("Visible Panels")
                    .font(.tallyTitleSmall)
                    .foregroundColor(Color.tallyInk)
            }
            
            VStack(spacing: TallySpacing.sm) {
                if localConfig.visiblePanels.isEmpty {
                    DropZonePlaceholder(text: "Drop panels here to show them")
                        .frame(minHeight: 80)
                } else {
                    ForEach(localConfig.visiblePanels) { panel in
                        PanelRow(panel: panel, isBeingDragged: draggingPanel == panel)
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
        }
        .padding(TallySpacing.lg)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.tallyPaperTint)
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .strokeBorder(
                            isDraggingOverVisible ? Color.tallyAccent : Color.clear,
                            style: StrokeStyle(lineWidth: 2, dash: [8, 4])
                        )
                )
        )
        .onDrop(of: [UTType.text], isTargeted: $isDraggingOverVisible) { _ in
            guard let draggingPanel else { return false }
            moveToVisible(draggingPanel)
            self.draggingPanel = nil
            return true
        }
    }

    private var hiddenPanelSection: some View {
        VStack(alignment: .leading, spacing: TallySpacing.md) {
            HStack {
                Image(systemName: "eye.slash.fill")
                    .foregroundColor(Color.tallyInkTertiary)
                Text("Hidden Panels")
                    .font(.tallyTitleSmall)
                    .foregroundColor(Color.tallyInk)
            }
            
            VStack(spacing: TallySpacing.sm) {
                if localConfig.hiddenPanels.isEmpty {
                    DropZonePlaceholder(text: "Drop panels here to hide them")
                        .frame(minHeight: 80)
                } else {
                    ForEach(localConfig.hiddenPanels) { panel in
                        HiddenPanelRow(panel: panel, isBeingDragged: draggingPanel == panel)
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
        }
        .padding(TallySpacing.lg)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.tallyPaperTint.opacity(0.5))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .strokeBorder(
                            isDraggingOverHidden ? Color.tallyInkTertiary : Color.clear,
                            style: StrokeStyle(lineWidth: 2, dash: [8, 4])
                        )
                )
        )
        .onDrop(of: [UTType.text], isTargeted: $isDraggingOverHidden) { _ in
            guard let draggingPanel else { return false }
            moveToHidden(draggingPanel)
            self.draggingPanel = nil
            return true
        }
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
    let isBeingDragged: Bool
    
    var body: some View {
        HStack(spacing: TallySpacing.md) {
            Image(systemName: "line.3.horizontal")
                .font(.system(size: 18, weight: .medium))
                .foregroundColor(Color.tallyInkSecondary)
                .frame(width: 28, height: 28)
            
            Text(panel.title)
                .font(.tallyLabelMedium)
                .foregroundColor(Color.tallyInk)
            
            Spacer()
            
            Image(systemName: "chevron.up.chevron.down")
                .font(.system(size: 12))
                .foregroundColor(Color.tallyInkTertiary)
        }
        .padding(.horizontal, TallySpacing.md)
        .padding(.vertical, TallySpacing.lg)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.tallyPaper)
                .shadow(color: Color.black.opacity(0.05), radius: 2, y: 1)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(Color.tallyInk.opacity(0.1), lineWidth: 1)
        )
        .opacity(isBeingDragged ? 0.5 : 1)
        .contentShape(Rectangle())
    }
}

// MARK: - Hidden Panel Row

private struct HiddenPanelRow: View {
    let panel: DashboardPanel
    let isBeingDragged: Bool
    
    var body: some View {
        HStack(spacing: TallySpacing.md) {
            Image(systemName: "line.3.horizontal")
                .font(.system(size: 18, weight: .medium))
                .foregroundColor(Color.tallyInkTertiary)
                .frame(width: 28, height: 28)
            
            Text(panel.title)
                .font(.tallyLabelMedium)
                .foregroundColor(Color.tallyInkSecondary)
            
            Spacer()
            
            Image(systemName: "chevron.up.chevron.down")
                .font(.system(size: 12))
                .foregroundColor(Color.tallyInkTertiary)
        }
        .padding(.horizontal, TallySpacing.md)
        .padding(.vertical, TallySpacing.lg)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.tallyPaper.opacity(0.6))
        )
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(Color.tallyInk.opacity(0.05), lineWidth: 1)
        )
        .opacity(isBeingDragged ? 0.5 : 1)
        .contentShape(Rectangle())
    }
}

// MARK: - Drop Zone Placeholder

private struct DropZonePlaceholder: View {
    let text: String
    
    var body: some View {
        VStack(spacing: TallySpacing.sm) {
            Image(systemName: "arrow.down.to.line.compact")
                .font(.system(size: 24))
                .foregroundColor(Color.tallyInkTertiary)
            
            Text(text)
                .font(.tallyBodySmall)
                .foregroundColor(Color.tallyInkTertiary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, TallySpacing.lg)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .strokeBorder(
                    Color.tallyInkTertiary.opacity(0.3),
                    style: StrokeStyle(lineWidth: 2, dash: [8, 4])
                )
        )
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
