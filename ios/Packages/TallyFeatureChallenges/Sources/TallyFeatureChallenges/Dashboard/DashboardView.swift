import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Dashboard view with highlights, charts, heatmap, and configurable panels
public struct DashboardView: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    @Bindable var manager: ChallengesManager
    let onConfigure: () -> Void
    let onWeeklySummary: () -> Void
    let onSelectChallenge: (Challenge) -> Void
    let onQuickAdd: (Challenge) -> Void
    let followedChallenges: [PublicChallenge]
    let onUnfollow: (String) async -> Void
    @State private var selectedChallengeFilter: String? = nil
    
    public init(
        manager: ChallengesManager,
        onConfigure: @escaping () -> Void,
        onWeeklySummary: @escaping () -> Void,
        onSelectChallenge: @escaping (Challenge) -> Void,
        onQuickAdd: @escaping (Challenge) -> Void,
        followedChallenges: [PublicChallenge],
        onUnfollow: @escaping (String) async -> Void
    ) {
        self.manager = manager
        self.onConfigure = onConfigure
        self.onWeeklySummary = onWeeklySummary
        self.onSelectChallenge = onSelectChallenge
        self.onQuickAdd = onQuickAdd
        self.followedChallenges = followedChallenges
        self.onUnfollow = onUnfollow
    }
    
    public var body: some View {
        LazyVStack(spacing: TallySpacing.lg) {
            if !manager.challenges.isEmpty {
                welcomeSection
                dashboardPanels
            }
            
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

    private var dashboardPanels: some View {
        Group {
            ForEach(manager.dashboardConfig.visiblePanels) { panel in
                switch panel {
                case .activeChallenges:
                    activeChallengesPanel
                case .highlights:
                    if let stats = manager.dashboardStats {
                        DashboardHighlightsView(stats: stats)
                    }
                case .personalRecords:
                    if let records = manager.personalRecords {
                        PersonalRecordsView(records: records)
                    }
                case .progressGraph:
                    ProgressChartView(
                        entries: manager.allEntries,
                        challenges: manager.challenges,
                        selectedChallengeId: selectedChallengeFilter
                    )
                    .tallyPadding(.horizontal)
                case .burnUpChart:
                    BurnUpDashboardSection(
                        challenges: manager.challenges,
                        stats: manager.stats,
                        entries: manager.allEntries
                    )
                }
            }
        }
    }
    
    private var activeChallengesPanel: some View {
        VStack(alignment: .leading, spacing: TallySpacing.sm) {
            Text("Active Challenges")
                .font(.title3.weight(.semibold))
                .foregroundColor(Color.tallyInk)
                .tallyPadding(.horizontal)
            
            if manager.activeChallenges.isEmpty {
                VStack(spacing: TallySpacing.sm) {
                    Text("No active challenges")
                        .font(.tallyBodyMedium)
                        .foregroundColor(Color.tallyInkSecondary)
                    Text("Start another challenge with the + button above.")
                        .font(.tallyBodySmall)
                        .foregroundColor(Color.tallyInkTertiary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, TallySpacing.lg)
            } else {
                LazyVGrid(
                    columns: dynamicTypeSize.isAccessibilitySize
                        ? [GridItem(.flexible())]
                        : [GridItem(.adaptive(minimum: 320), spacing: TallySpacing.base)],
                    alignment: .leading,
                    spacing: TallySpacing.base
                ) {
                    ForEach(manager.activeChallenges) { challenge in
                        // Show card even for newly-created challenges that may not have stats yet
                        ChallengeCardView(
                            challenge: challenge,
                            stats: manager.stats[challenge.id],
                            entries: manager.entries(for: challenge.id),
                            onTap: { onSelectChallenge(challenge) },
                            onQuickAdd: { onQuickAdd(challenge) }
                        )
                    }
                }
                .tallyPadding(.horizontal)
            }
        }
    }
    
    private var welcomeSection: some View {
        VStack(alignment: .leading, spacing: TallySpacing.md) {
            Text(Date.now, format: .dateTime.weekday(.wide).month(.wide).day())
                .font(.subheadline)
                .foregroundStyle(Color.tallyInkSecondary)
            Text("Your progress")
                .font(.largeTitle.weight(.semibold))
                .tracking(-0.8)
                .foregroundStyle(Color.tallyInk)
            Button(action: onWeeklySummary) {
                Label("Your week in review", systemImage: "chart.bar.xaxis")
                    .font(.subheadline.weight(.medium))
                    .frame(minHeight: 44)
            }
            .buttonStyle(.plain)
            .foregroundStyle(Color.tallyAccent)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
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
                onSelectChallenge: { _ in },
                onQuickAdd: { _ in },
                followedChallenges: [],
                onUnfollow: { _ in }
            )
            .navigationTitle("Dashboard")
    }
}
