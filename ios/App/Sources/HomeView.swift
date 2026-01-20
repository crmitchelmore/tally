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
                // Quick add entry for challenge
                Task {
                    await quickAddEntry(for: challenge)
                }
            }
        )
        .navigationTitle("Tally")
        .toolbar {
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
                        Task {
                            await quickAddEntry(for: challenge)
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
    }
    
    private func quickAddEntry(for challenge: Challenge) async {
        // Create entry via API client
        do {
            let request = CreateEntryRequest(
                challengeId: challenge.id,
                date: ISO8601DateFormatter().string(from: Date()).prefix(10).description,
                count: 1,
                note: nil,
                feeling: nil
            )
            _ = try await APIClient.shared.createEntry(request)
            // Refresh to show updated stats
            await challengesManager.refresh()
        } catch {
            // Entry creation failed, but we show challenges anyway
        }
    }
}

#Preview {
    NavigationStack {
        HomeView()
    }
}
