import SwiftUI
import TallyDesign
import TallyFeatureAuth
import TallyFeatureChallenges
import TallyFeatureAPIClient

/// Home view - challenges dashboard with offline-first support
struct HomeView: View {
    @State private var challengesManager = ChallengesManager()
    @State private var showCreateSheet = false
    @State private var selectedChallenge: Challenge?
    @State private var editingChallenge: Challenge?
    @State private var addEntryChallenge: Challenge?
    @State private var recentEntriesForAdd: [Entry] = []
    @State private var showDashboardConfig = false
    @State private var showWeeklySummary = false
    @State private var followedChallenges: [PublicChallenge] = []
    @State private var deletedChallenge: Challenge?
    
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    @Environment(\.scenePhase) private var scenePhase
    
    var body: some View {
        ScrollView {
            VStack(spacing: TallySpacing.lg) {
                DashboardView(
                    manager: challengesManager,
                    onConfigure: {
                        showDashboardConfig = true
                    },
                    onWeeklySummary: {
                        showWeeklySummary = true
                    },
                    onSelectChallenge: { challenge in
                        selectedChallenge = challenge
                    },
                    onQuickAdd: { challenge in
                        Task {
                            await prepareAndShowAddEntry(for: challenge)
                        }
                    },
                    followedChallenges: followedChallenges,
                    onUnfollow: { id in
                        await handleUnfollow(id)
                    }
                )
                
                ChallengeListView(
                    manager: challengesManager,
                    onSelectChallenge: { challenge in
                        selectedChallenge = challenge
                    },
                    onCreateChallenge: {
                        showCreateSheet = true
                    },
                    onQuickAdd: { challenge in
                        // Open add entry sheet
                        Task {
                            await prepareAndShowAddEntry(for: challenge)
                        }
                    },
                    onDeleteChallenge: { challenge in
                        deletedChallenge = challenge
                        Task {
                            await challengesManager.deleteChallenge(id: challenge.id)
                        }
                    }
                )
            }
            .tallyPadding(.vertical)
        }
        .accessibilityIdentifier("dashboard")
        .navigationTitle("Tally")
        .toolbar {
            // Sync status in leading position (won't overlap with title)
            ToolbarItem(placement: .navigationBarLeading) {
                SyncStatusToolbarItem(
                    syncState: challengesManager.syncState,
                    isRefreshing: challengesManager.isRefreshing
                )
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    showCreateSheet = true
                } label: {
                    Image(systemName: "plus")
                }
                .accessibilityIdentifier("create-challenge-button")
            }
        }
        .sheet(isPresented: $showDashboardConfig) {
            DashboardConfigSheet(
                config: challengesManager.dashboardConfig,
                onChange: { config in
                    challengesManager.updateDashboardConfig(config)
                }
            )
        }
        .sheet(isPresented: $showWeeklySummary) {
            WeeklySummarySheet(
                entries: challengesManager.allEntries,
                challengesById: Dictionary(uniqueKeysWithValues: challengesManager.challenges.map { ($0.id, $0) }),
                onClose: {
                    showWeeklySummary = false
                }
            )
            .presentationDetents([.medium, .large])
        }
        .sheet(isPresented: $showCreateSheet) {
            ChallengeFormView(
                manager: challengesManager,
                onSave: {
                    showCreateSheet = false
                },
                onCancel: {
                    showCreateSheet = false
                }
            )
        }
        .sheet(item: $selectedChallenge) { challenge in
            NavigationStack {
                ChallengeDetailView(
                    challenge: challenge,
                    manager: challengesManager,
                    onAddEntry: {
                        selectedChallenge = nil
                        Task {
                            await prepareAndShowAddEntry(for: challenge)
                        }
                    },
                    onEdit: {
                        selectedChallenge = nil
                        editingChallenge = challenge
                    },
                    onDismiss: {
                        selectedChallenge = nil
                    },
                    onDeleteChallenge: { challenge in
                        deletedChallenge = challenge
                    }
                )
            }
        }
        .sheet(item: $editingChallenge) { challenge in
            ChallengeFormView(
                manager: challengesManager,
                existingChallenge: challenge,
                onSave: {
                    editingChallenge = nil
                },
                onCancel: {
                    editingChallenge = nil
                }
            )
        }
        .sheet(item: $addEntryChallenge) { challenge in
            AddEntrySheet(
                challenge: challenge,
                recentEntries: recentEntriesForAdd,
                onSubmit: { request in
                    // Optimistic save - returns immediately, syncs in background
                    challengesManager.addEntry(request)
                },
                onDismiss: {
                    addEntryChallenge = nil
                }
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
                    onDismiss: {
                        self.deletedChallenge = nil
                    }
                )
                .tallyPadding(.horizontal)
                .tallyPadding(.bottom, TallySpacing.lg)
            }
        }
        .task {
            await loadFollowedChallenges()
            await challengesManager.refresh()
        }
        .onChange(of: scenePhase) { _, newPhase in
            if newPhase == .active {
                Task {
                    await challengesManager.refresh()
                }
            }
        }
    }
    
    /// Fetch recent entries and show the add entry sheet
    private func prepareAndShowAddEntry(for challenge: Challenge) async {
        // First show the sheet with cached entries (instant)
        recentEntriesForAdd = challengesManager.recentEntries(for: challenge.id)
        addEntryChallenge = challenge
        
        // Then fetch fresh entries in background for next time
        await challengesManager.fetchEntries(for: challenge.id)
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

/// Compact sync status for toolbar - shows only when there's something to show
struct SyncStatusToolbarItem: View {
    let syncState: SyncState
    let isRefreshing: Bool
    
    var body: some View {
        Group {
            if isRefreshing {
                HStack(spacing: 4) {
                    ProgressView()
                        .scaleEffect(0.6)
                    Text("Updating")
                        .font(.caption)
                        .foregroundColor(Color.tallyInkSecondary)
                }
            } else {
                switch syncState {
                case .synced:
                    // Show checkmark briefly or just "Up to date" text
                    Text("Up to date")
                        .font(.caption)
                        .foregroundColor(Color.tallyInkTertiary)
                case .pending(let count):
                    HStack(spacing: 4) {
                        Image(systemName: "clock.fill")
                            .font(.caption)
                        Text("\(count) pending")
                            .font(.caption)
                    }
                    .foregroundColor(Color.tallyWarning)
                case .syncing:
                    HStack(spacing: 4) {
                        ProgressView()
                            .scaleEffect(0.6)
                        Text("Syncing")
                            .font(.caption)
                    }
                    .foregroundColor(Color.tallyInkSecondary)
                case .offline:
                    HStack(spacing: 4) {
                        Image(systemName: "wifi.slash")
                            .font(.caption)
                        Text("Offline")
                            .font(.caption)
                    }
                    .foregroundColor(Color.tallyInkSecondary)
                case .failed:
                    HStack(spacing: 4) {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .font(.caption)
                        Text("Sync failed")
                            .font(.caption)
                    }
                    .foregroundColor(Color.tallyError)
                }
            }
        }
    }
}

#Preview {
    NavigationStack {
        HomeView()
    }
}
