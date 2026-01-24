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
                // Show add entry sheet for challenge
                addEntryChallenge = challenge
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
                        selectedChallenge = nil
                        addEntryChallenge = challenge
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
                onSave: {
                    addEntryChallenge = nil
                    Task { await challengesManager.refresh() }
                },
                onCancel: {
                    addEntryChallenge = nil
                }
            )
        }
    }
}

#Preview {
    NavigationStack {
        HomeView()
    }
}
