import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Dashboard view with highlights, charts, heatmap, and configurable panels
public struct DashboardView: View {
    @Bindable var manager: ChallengesManager
    
    @State private var showConfig = false
    @State private var selectedChartType: ChartType = .progress
    @State private var selectedChallengeFilter: String? = nil
    
    public init(manager: ChallengesManager) {
        self.manager = manager
    }
    
    public var body: some View {
        ScrollView {
            LazyVStack(spacing: TallySpacing.lg) {
                // Dashboard highlights (always visible)
                if let stats = manager.dashboardStats {
                    DashboardHighlightsView(stats: stats)
                }
                
                // Personal records (always visible)
                if let records = manager.personalRecords {
                    PersonalRecordsView(records: records)
                }
                
                // Configurable panels based on user preference
                // For now, show all panels until we implement config
                
                // Activity heatmap
                ActivityHeatmapView(entries: manager.allEntries)
                    .tallyPadding(.horizontal)
                
                // Progress chart with challenge filter
                ProgressChartView(
                    entries: manager.allEntries,
                    challenges: manager.challenges,
                    selectedChallengeId: selectedChallengeFilter
                )
                .tallyPadding(.horizontal)
                
                // Burn-up chart towards goal
                if let challenge = manager.activeChallenges.first,
                   let stats = manager.stats(for: challenge.id) {
                    BurnUpChartView(
                        challenge: challenge,
                        stats: stats,
                        entries: manager.allEntries.filter { $0.challengeId == challenge.id }
                    )
                    .tallyPadding(.horizontal)
                }
            }
            .tallyPadding(.vertical)
        }
        .refreshable {
            await manager.refresh()
        }
    }
}

// MARK: - Chart Type Picker

enum ChartType: String, CaseIterable {
    case progress = "Progress"
    case burnUp = "Burn Up"
    case heatmap = "Activity"
}

// MARK: - Preview

#Preview {
    NavigationStack {
        DashboardView(manager: ChallengesManager())
            .navigationTitle("Dashboard")
    }
}
