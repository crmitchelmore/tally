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
    @State private var showDashboard = false
    
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: TallySpacing.lg) {
                // Dashboard section (highlights, records)
                dashboardSection
                
                // Challenges list
                challengesSection
            }
            .tallyPadding(.vertical)
        }
        .background(Color.tallyPaper)
        .refreshable {
            await challengesManager.refresh()
        }
        .task {
            await challengesManager.refresh()
        }
        .navigationTitle("Tally")
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button {
                    showDashboard.toggle()
                } label: {
                    Image(systemName: showDashboard ? "chart.bar.fill" : "chart.bar")
                }
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
                manager: challengesManager,
                onSave: {
                    addEntryChallenge = nil
                },
                onCancel: {
                    addEntryChallenge = nil
                }
            )
        }
    }
    
    // MARK: - Dashboard Section
    
    @ViewBuilder
    private var dashboardSection: some View {
        if showDashboard {
            DashboardView(manager: challengesManager)
        } else {
            // Compact highlights
            if let stats = challengesManager.dashboardStats {
                compactHighlights(stats: stats)
            }
        }
    }
    
    private func compactHighlights(stats: DashboardStats) -> some View {
        HStack(spacing: TallySpacing.md) {
            compactStat(value: "\(stats.today)", label: "Today")
            compactStat(value: "\(stats.totalMarks)", label: "Week")
            compactStat(value: "\(stats.bestStreak)d", label: "Streak")
        }
        .tallyPadding(.horizontal)
    }
    
    private func compactStat(value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.tallyMonoBody)
                .foregroundColor(Color.tallyInk)
            Text(label)
                .font(.tallyLabelSmall)
                .foregroundColor(Color.tallyInkSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, TallySpacing.sm)
        .background(Color.tallyPaperTint)
        .cornerRadius(8)
    }
    
    // MARK: - Challenges Section
    
    @ViewBuilder
    private var challengesSection: some View {
        if challengesManager.isLoading && challengesManager.challengesWithStats.isEmpty {
            loadingState
        } else if let error = challengesManager.errorMessage {
            errorState(error)
        } else if challengesManager.challengesWithStats.isEmpty {
            emptyState
        } else {
            challengesList
        }
    }
    
    private var loadingState: some View {
        VStack(spacing: TallySpacing.lg) {
            ProgressView()
                .scaleEffect(1.2)
            Text("Loading challenges…")
                .font(.tallyBodyMedium)
                .foregroundColor(Color.tallyInkSecondary)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, TallySpacing.xxl)
    }
    
    private func errorState(_ message: String) -> some View {
        VStack(spacing: TallySpacing.lg) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundColor(Color.tallyWarning)
            Text("Something went wrong")
                .font(.tallyTitleSmall)
                .foregroundColor(Color.tallyInk)
            Text(message)
                .font(.tallyBodySmall)
                .foregroundColor(Color.tallyInkSecondary)
                .multilineTextAlignment(.center)
            Button("Try Again") {
                Task { await challengesManager.refresh() }
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.tallyAccent)
        }
        .tallyPadding()
    }
    
    private var emptyState: some View {
        VStack(spacing: TallySpacing.lg) {
            TallyMarkView(count: 5, size: 80)
            
            Text("No challenges yet")
                .font(.tallyTitleMedium)
                .foregroundColor(Color.tallyInk)
            
            Text("Create your first challenge and start tracking your progress.")
                .font(.tallyBodyMedium)
                .foregroundColor(Color.tallyInkSecondary)
                .multilineTextAlignment(.center)
            
            Button {
                showCreateSheet = true
            } label: {
                Label("Create Challenge", systemImage: "plus")
                    .font(.tallyTitleSmall)
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.tallyAccent)
        }
        .tallyPadding()
        .accessibilityIdentifier("empty-state")
    }
    
    private var challengesList: some View {
        VStack(spacing: TallySpacing.md) {
            // Sync banner
            if challengesManager.syncState != .synced {
                SyncStatusBanner(state: challengesManager.syncState)
                    .tallyPadding(.horizontal)
            }
            
            // Active challenges
            ForEach(challengesManager.activeChallengesWithStats, id: \.challenge.id) { item in
                ChallengeCardView(
                    challenge: item.challenge,
                    stats: item.stats,
                    onTap: { selectedChallenge = item.challenge },
                    onQuickAdd: { addEntryChallenge = item.challenge }
                )
                .tallyPadding(.horizontal)
            }
        }
    }
}

#Preview {
    NavigationStack {
        HomeView()
    }
}
