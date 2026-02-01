import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Dashboard view with highlights, charts, heatmap, and configurable panels
public struct DashboardView: View {
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
            welcomeSection
            
            dashboardPanels
            
            FollowedChallengesSection(
                challenges: followedChallenges,
                onUnfollow: onUnfollow
            )
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
                .font(.tallyTitleSmall)
                .foregroundColor(Color.tallyInk)
                .tallyPadding(.horizontal)
            
            if manager.activeChallenges.isEmpty {
                VStack(spacing: TallySpacing.sm) {
                    Text("No active challenges")
                        .font(.tallyBodyMedium)
                        .foregroundColor(Color.tallyInkSecondary)
                    Text("Create your first challenge to get started")
                        .font(.tallyBodySmall)
                        .foregroundColor(Color.tallyInkTertiary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, TallySpacing.lg)
            } else {
                LazyVStack(spacing: TallySpacing.sm) {
                    ForEach(manager.activeChallenges) { challenge in
                        if let stats = manager.stats[challenge.id] {
                            ChallengeCardView(
                                challenge: challenge,
                                stats: stats,
                                entries: manager.entries(for: challenge.id),
                                onTap: { onSelectChallenge(challenge) },
                                onQuickAdd: { onQuickAdd(challenge) }
                            )
                            .tallyPadding(.horizontal)
                        }
                    }
                }
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
                onSelectChallenge: { _ in },
                onQuickAdd: { _ in },
                followedChallenges: [],
                onUnfollow: { _ in }
            )
            .navigationTitle("Dashboard")
    }
}
