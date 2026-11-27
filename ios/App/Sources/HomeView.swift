import SwiftUI
import TallyDesign
import TallyFeatureAuth
import TallyFeatureChallenges
import TallyFeatureAPIClient
import TallyWidgetShared

/// Home view - challenges dashboard with offline-first support
struct HomeView: View {
    @State private var challengesManager = ChallengesManager()
    @State private var showCreateSheet = false
    @State private var selectedChallengeID: Challenge.ID?
    @State private var preferredColumn: NavigationSplitViewColumn = .sidebar
    @State private var editingChallenge: Challenge?
    @State private var addEntryChallenge: Challenge?
    @State private var recentEntriesForAdd: [Entry] = []
    @State private var showDashboardConfig = false
    @State private var showWeeklySummary = false
    @State private var followedChallenges: [PublicChallenge] = []
    @State private var deletedChallenge: Challenge?
    
    @Environment(\.scenePhase) private var scenePhase
    
    let onOpenSettings: () -> Void

    var body: some View {
        NavigationSplitView(preferredCompactColumn: $preferredColumn) {
            challengeList
                .navigationSplitViewColumnWidth(min: 240, ideal: 300, max: 380)
        } detail: {
            if let selectedChallengeID,
               let challenge = challengesManager.challenge(id: selectedChallengeID) {
                ChallengeDetailView(
                    challenge: challenge,
                    manager: challengesManager,
                    onAddEntry: { openEntry(for: challenge) },
                    onEdit: { editingChallenge = challenge },
                    onDismiss: {
                        self.selectedChallengeID = nil
                        preferredColumn = .sidebar
                    },
                    onDeleteChallenge: { deletedChallenge = $0 }
                )
                .id(challenge.id)
            } else {
                dashboard
            }
        }
        .navigationSplitViewStyle(.balanced)
        .background(Color.tallyPaper)
        .sheet(isPresented: $showDashboardConfig) {
            DashboardConfigSheet(
                config: challengesManager.dashboardConfig,
                onChange: { challengesManager.updateDashboardConfig($0) }
            )
        }
        .sheet(isPresented: $showWeeklySummary) {
            WeeklySummarySheet(
                entries: challengesManager.allEntries,
                challengesById: Dictionary(uniqueKeysWithValues: challengesManager.challenges.map { ($0.id, $0) }),
                onClose: { showWeeklySummary = false }
            )
            .presentationDetents([.medium, .large])
        }
        .sheet(isPresented: $showCreateSheet) {
            ChallengeFormView(
                manager: challengesManager,
                onSave: { showCreateSheet = false },
                onCancel: { showCreateSheet = false }
            )
        }
        .sheet(item: $editingChallenge) { challenge in
            ChallengeFormView(
                manager: challengesManager,
                existingChallenge: challenge,
                onSave: { editingChallenge = nil },
                onCancel: { editingChallenge = nil }
            )
        }
        .sheet(item: $addEntryChallenge) { challenge in
            AddEntrySheet(
                challenge: challenge,
                recentEntries: recentEntriesForAdd,
                onSubmit: { challengesManager.addEntry($0) },
                onDismiss: { addEntryChallenge = nil }
            )
        }
        .overlay(alignment: .bottom) {
            if let deletedChallenge {
                UndoToastView(
                    message: "Challenge deleted",
                    onUndo: {
                        Task {
                            _ = try? await APIClient.shared.restoreChallenge(id: deletedChallenge.id)
                            await challengesManager.refresh()
                        }
                        self.deletedChallenge = nil
                    },
                    onDismiss: { self.deletedChallenge = nil }
                )
                .tallyPadding(.horizontal)
                .tallyPadding(.bottom, TallySpacing.lg)
            }
        }
        .onChange(of: scenePhase, initial: true) { _, newPhase in
            if newPhase == .active {
                Task {
                    followedChallenges = []
                    await challengesManager.refresh()
                }
            }
        }
        .onAppear {
            challengesManager.widgetDataUpdateCallback = { challenges, stats in
                Task { @MainActor in
                    WidgetDataSyncService.shared.syncWidgetData(challenges: challenges, stats: stats)
                }
            }
        }
    }

    private var challengeList: some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: TallySpacing.sm) {
                ForEach(challengesManager.activeChallenges) { challenge in
                    ChallengePickerRow(
                        challenge: challenge,
                        total: challengesManager.stats(for: challenge.id)?.totalCount ?? 0,
                        isSelected: selectedChallengeID == challenge.id,
                        onSelect: { openChallenge(challenge) },
                        onIncrement: { challengesManager.incrementChallenge(id: challenge.id) },
                        onLog: { openEntry(for: challenge) }
                    )
                }
                .tallyPadding(.horizontal)

                ChallengeListView(
                    manager: challengesManager,
                    onSelectChallenge: openChallenge,
                    onCreateChallenge: { showCreateSheet = true },
                    onQuickAdd: openEntry,
                    onDeleteChallenge: { challenge in
                        deletedChallenge = challenge
                        Task { await challengesManager.deleteChallenge(id: challenge.id) }
                    }
                )
            }
            .tallyPadding(.vertical)
            .frame(maxWidth: 550)
            .frame(maxWidth: .infinity)
        }
        .refreshable { await challengesManager.refresh() }
        .accessibilityIdentifier("dashboard")
        .background(Color.tallyPaper)
        .navigationTitle("Tally")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                Button(action: openDashboard) {
                    Label("Dashboard", systemImage: "chart.bar.xaxis")
                }
            }
            ToolbarItemGroup(placement: .primaryAction) {
                Button {
                    showCreateSheet = true
                } label: {
                    Label("Create challenge", systemImage: "plus")
                }
                .accessibilityIdentifier("create-challenge-button")

                UserProfileButton(onOpenSettings: onOpenSettings)
            }
        }
    }

    private var dashboard: some View {
        ScrollView {
            Group {
                if challengesManager.challenges.isEmpty {
                    ContentUnavailableView("No challenges yet", systemImage: "chart.bar.xaxis")
                } else {
                    DashboardView(
                        manager: challengesManager,
                        onConfigure: { showDashboardConfig = true },
                        onWeeklySummary: { showWeeklySummary = true },
                        onSelectChallenge: openChallenge,
                        onQuickAdd: openEntry,
                        followedChallenges: followedChallenges,
                        onUnfollow: handleUnfollow
                    )
                }
            }
            .tallyPadding(.vertical)
            .frame(maxWidth: 850)
            .frame(maxWidth: .infinity)
        }
        .refreshable { await challengesManager.refresh() }
        .background(Color.tallyPaper)
        .navigationTitle("Dashboard")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .status) {
                SyncStatusToolbarItem(
                    syncState: challengesManager.syncState,
                    isRefreshing: challengesManager.isRefreshing
                )
            }
        }
    }

    private func openDashboard() {
        selectedChallengeID = nil
        preferredColumn = .detail
    }

    private func openChallenge(_ challenge: Challenge) {
        selectedChallengeID = challenge.id
        preferredColumn = .detail
    }

    private func openEntry(for challenge: Challenge) {
        recentEntriesForAdd = challengesManager.recentEntries(for: challenge.id)
        addEntryChallenge = challenge
        Task { await challengesManager.fetchEntries(for: challenge.id) }
    }

    private func loadFollowedChallenges() async {
        do {
            followedChallenges = try await APIClient.shared.listFollowedChallenges()
        } catch {
            print("[HomeView] Failed to load followed challenges: \(error.localizedDescription)")
            followedChallenges = []
        }
    }
    
    private func handleUnfollow(_ id: String) async {
        do {
            try await APIClient.shared.unfollowChallenge(id: id)
            followedChallenges.removeAll { $0.id == id }
        } catch {
            print("[HomeView] Failed to unfollow challenge: \(error.localizedDescription)")
            await loadFollowedChallenges()
        }
    }
}

/// A text-first challenge picker with independent, thumb-sized logging actions.
private struct ChallengePickerRow: View {
    let challenge: Challenge
    let total: Int
    let isSelected: Bool
    let onSelect: () -> Void
    let onIncrement: () -> Void
    let onLog: () -> Void

    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        let layout = dynamicTypeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: TallySpacing.xs))
            : AnyLayout(HStackLayout(spacing: TallySpacing.sm))
        layout {
            Button(action: onSelect) {
                VStack(alignment: .leading, spacing: TallySpacing.xs) {
                    Text(challenge.name)
                        .font(.headline)
                        .foregroundStyle(Color.tallyInk)
                    Text("\(total.formatted()) of \(challenge.target.formatted()) \(challenge.resolvedUnitLabel)")
                        .font(.subheadline.monospacedDigit())
                        .foregroundStyle(Color.tallyInkSecondary)
                    if let startsText = challenge.startsInText, challenge.isFuture {
                        Text(startsText)
                            .font(.caption)
                            .foregroundStyle(Color.tallyInkSecondary)
                    }
                }
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
                .frame(maxWidth: .infinity, minHeight: 48, alignment: .leading)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityHint("View challenge details")
            .accessibilityAddTraits(isSelected ? .isSelected : [])
            .accessibilityIdentifier("open-challenge-\(challenge.name)")

            if challenge.hasStarted {
                HStack(spacing: TallySpacing.xs) {
                    if challenge.resolvedCountType == .simple {
                        Button(action: onIncrement) {
                            Text("+1")
                                .font(.body.weight(.semibold).monospacedDigit())
                                .padding(.horizontal, TallySpacing.sm)
                                .frame(minWidth: 48, minHeight: 48)
                                .background(Color.tallyAccent, in: RoundedRectangle(cornerRadius: 12))
                                .foregroundStyle(.white)
                        }
                        .buttonStyle(TallyPressStyle())
                        .accessibilityLabel("Add one to \(challenge.name)")
                        .accessibilityIdentifier("increment-\(challenge.name)")
                    }

                    Button(action: onLog) {
                        Image(systemName: "square.and.pencil")
                            .frame(minWidth: 44, minHeight: 48)
                            .contentShape(Rectangle())
                    }
                    .buttonStyle(TallyPressStyle())
                    .foregroundStyle(Color.tallyInkSecondary)
                    .accessibilityLabel("Log progress for \(challenge.name)")
                    .accessibilityIdentifier("quick-add")
                }
            }
        }
        .padding(.horizontal, TallySpacing.md)
        .padding(.vertical, TallySpacing.xs)
        .background(
            isSelected ? Color.tallyAccent.opacity(0.12) : Color.tallySurface,
            in: RoundedRectangle(cornerRadius: 14)
        )
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("challenge-card-\(challenge.name)")
    }
}

/// Compact sync status for toolbar - shows only when there's something to show
struct SyncStatusToolbarItem: View {
    let syncState: SyncState
    let isRefreshing: Bool
    
    var body: some View {
        Group {
            if isRefreshing || syncState == .syncing {
                ProgressView()
                    .accessibilityLabel(isRefreshing ? "Updating challenges" : "Syncing changes")
            } else {
                Image(systemName: iconName)
                    .foregroundStyle(statusColor)
                    .accessibilityLabel(syncState.displayText)
            }
        }
        .frame(width: 24, height: 24)
    }

    private var statusColor: Color {
        switch syncState {
        case .failed: return .tallyError
        case .pending: return .tallyWarning
        default: return .tallyInkSecondary
        }
    }

    private var iconName: String {
        switch syncState {
        case .synced: return "checkmark.icloud"
        case .pending: return "clock.badge.exclamationmark"
        case .syncing: return "arrow.triangle.2.circlepath"
        case .offline: return "wifi.slash"
        case .failed: return "exclamationmark.icloud"
        }
    }
}

#Preview {
    HomeView(onOpenSettings: {})
}
