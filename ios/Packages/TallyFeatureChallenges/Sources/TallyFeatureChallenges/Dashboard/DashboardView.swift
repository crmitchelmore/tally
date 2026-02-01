import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Dashboard view with highlights, charts, heatmap, and configurable panels
public struct DashboardView: View {
    @Bindable var manager: ChallengesManager
    let onConfigure: () -> Void
    let onWeeklySummary: () -> Void
    let followedChallenges: [PublicChallenge]
    let onUnfollow: (String) async -> Void
    @State private var selectedChallengeFilter: String? = nil
    
    public init(
        manager: ChallengesManager,
        onConfigure: @escaping () -> Void,
        onWeeklySummary: @escaping () -> Void,
        followedChallenges: [PublicChallenge],
        onUnfollow: @escaping (String) async -> Void
    ) {
        self.manager = manager
        self.onConfigure = onConfigure
        self.onWeeklySummary = onWeeklySummary
        self.followedChallenges = followedChallenges
        self.onUnfollow = onUnfollow
    }
    
    public var body: some View {
        LazyVStack(spacing: TallySpacing.lg) {
            welcomeSection
            
            // Dashboard highlights
            if manager.dashboardConfig.panels.highlights, let stats = manager.dashboardStats {
                DashboardHighlightsView(stats: stats)
            }
            
            // Personal records
            if manager.dashboardConfig.panels.personalRecords, let records = manager.personalRecords {
                PersonalRecordsView(records: records)
            }
            
            // Progress chart with challenge filter
            if manager.dashboardConfig.panels.progressGraph {
                ProgressChartView(
                    entries: manager.allEntries,
                    challenges: manager.challenges,
                    selectedChallengeId: selectedChallengeFilter
                )
                .tallyPadding(.horizontal)
            }
            
            if manager.dashboardConfig.panels.burnUpChart {
                BurnUpDashboardSection(
                    challenges: manager.challenges,
                    stats: manager.stats,
                    entries: manager.allEntries
                )
            }
            
            FollowedChallengesSection(
                challenges: followedChallenges,
                onUnfollow: onUnfollow
            )
            
            CommunityPreviewSection()
        }
        .tallyPadding(.vertical)
        .refreshable {
            await manager.refresh()
        }
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    onConfigure()
                } label: {
                    Image(systemName: "slider.horizontal.3")
                }
                .accessibilityLabel("Configure dashboard")
            }
        }
    }
    
    private var welcomeSection: some View {
        HStack(alignment: .top, spacing: TallySpacing.md) {
            VStack(alignment: .leading, spacing: TallySpacing.xs) {
                Text("Welcome back")
                    .font(.tallyTitleMedium)
                    .foregroundColor(Color.tallyInk)
                Text("Your tallies are ready. Log progress below.")
                    .font(.tallyBodySmall)
                    .foregroundColor(Color.tallyInkSecondary)
            }
            
            Spacer()
            
            Button {
                onWeeklySummary()
            } label: {
                Text("Weekly Summary")
                    .font(.tallyLabelMedium)
                    .foregroundColor(Color.tallyInk)
                    .padding(.horizontal, TallySpacing.md)
                    .padding(.vertical, TallySpacing.sm)
                    .background(Color.tallyPaperTint)
                    .cornerRadius(12)
            }
            .buttonStyle(.plain)
        }
        .tallyPadding(.horizontal)
    }
}

// MARK: - Preview

#Preview {
    NavigationStack {
        DashboardView(
            manager: ChallengesManager(),
            onConfigure: {},
            onWeeklySummary: {},
            followedChallenges: [],
            onUnfollow: { _ in }
        )
            .navigationTitle("Dashboard")
    }
}
