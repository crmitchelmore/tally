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
    
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    
    var body: some View {
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
            }
        )
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
            }
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
    }
    
    /// Fetch recent entries and show the add entry sheet
    private func prepareAndShowAddEntry(for challenge: Challenge) async {
        // First show the sheet with cached entries (instant)
        recentEntriesForAdd = challengesManager.recentEntries(for: challenge.id)
        addEntryChallenge = challenge
        
        // Then fetch fresh entries in background for next time
        await challengesManager.fetchEntries(for: challenge.id)
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
