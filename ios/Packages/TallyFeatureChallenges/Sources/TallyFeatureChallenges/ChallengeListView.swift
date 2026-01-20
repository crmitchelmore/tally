import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// List view for challenges with empty, loading, and error states
public struct ChallengeListView: View {
    @Bindable var manager: ChallengesManager
    let onSelectChallenge: (Challenge) -> Void
    let onCreateChallenge: () -> Void
    let onQuickAdd: (Challenge) -> Void
    
    @State private var showArchived = false
    
    public init(
        manager: ChallengesManager,
        onSelectChallenge: @escaping (Challenge) -> Void,
        onCreateChallenge: @escaping () -> Void,
        onQuickAdd: @escaping (Challenge) -> Void
    ) {
        self.manager = manager
        self.onSelectChallenge = onSelectChallenge
        self.onCreateChallenge = onCreateChallenge
        self.onQuickAdd = onQuickAdd
    }
    
    public var body: some View {
        Group {
            if manager.isLoading && manager.challenges.isEmpty {
                LoadingStateView()
            } else if let error = manager.errorMessage {
                ErrorStateView(message: error) {
                    Task { await manager.refresh() }
                }
            } else if manager.challenges.isEmpty {
                EmptyStateView(onCreateChallenge: onCreateChallenge)
            } else {
                challengesList
            }
        }
        .refreshable {
            await manager.refresh()
        }
        .task {
            await manager.refresh()
        }
    }
    
    private var challengesList: some View {
        ScrollView {
            LazyVStack(spacing: TallySpacing.md) {
                // Sync status banner when offline or pending
                if manager.syncState != .synced {
                    SyncStatusBanner(state: manager.syncState)
                        .tallyPadding(.horizontal)
                }
                
                // Active challenges
                if !manager.activeChallenges.isEmpty {
                    Section {
                        ForEach(manager.activeChallenges) { challenge in
                            ChallengeCardView(
                                challenge: challenge,
                                stats: nil, // Stats loaded separately per card
                                onTap: { onSelectChallenge(challenge) },
                                onQuickAdd: { onQuickAdd(challenge) }
                            )
                        }
                    } header: {
                        SectionHeader(title: "Active", count: manager.activeChallenges.count)
                    }
                    .tallyPadding(.horizontal)
                }
                
                // Archived challenges (collapsible)
                if !manager.archivedChallenges.isEmpty {
                    Section {
                        DisclosureGroup(isExpanded: $showArchived) {
                            ForEach(manager.archivedChallenges) { challenge in
                                ChallengeCardView(
                                    challenge: challenge,
                                    stats: nil,
                                    onTap: { onSelectChallenge(challenge) },
                                    onQuickAdd: { onQuickAdd(challenge) }
                                )
                                .opacity(0.7)
                            }
                        } label: {
                            SectionHeader(title: "Archived", count: manager.archivedChallenges.count)
                        }
                        .tint(Color.tallyInkSecondary)
                    }
                    .tallyPadding(.horizontal)
                }
            }
            .tallyPadding(.vertical)
        }
    }
}

// MARK: - Supporting Views

struct SectionHeader: View {
    let title: String
    let count: Int
    
    var body: some View {
        HStack {
            Text(title)
                .font(.tallyTitleSmall)
                .foregroundColor(Color.tallyInk)
            
            Text("\(count)")
                .font(.tallyLabelSmall)
                .foregroundColor(Color.tallyInkSecondary)
                .padding(.horizontal, 8)
                .padding(.vertical, 2)
                .background(Color.tallyPaperTint)
                .cornerRadius(4)
            
            Spacer()
        }
        .padding(.bottom, TallySpacing.xs)
    }
}

struct SyncStatusBanner: View {
    let state: SyncState
    
    var body: some View {
        HStack(spacing: TallySpacing.sm) {
            Image(systemName: iconName)
                .foregroundColor(iconColor)
            
            Text(state.displayText)
                .font(.tallyLabelMedium)
                .foregroundColor(Color.tallyInk)
            
            Spacer()
            
            if case .syncing = state {
                ProgressView()
                    .scaleEffect(0.8)
            }
        }
        .tallyPadding()
        .background(backgroundColor)
        .cornerRadius(8)
    }
    
    private var iconName: String {
        switch state {
        case .synced: return "checkmark.circle.fill"
        case .pending: return "clock.fill"
        case .syncing: return "arrow.triangle.2.circlepath"
        case .failed: return "exclamationmark.triangle.fill"
        case .offline: return "wifi.slash"
        }
    }
    
    private var iconColor: Color {
        switch state {
        case .synced: return Color.tallySuccess
        case .pending: return Color.tallyWarning
        case .syncing: return Color.tallyInkSecondary
        case .failed: return Color.tallyError
        case .offline: return Color.tallyInkSecondary
        }
    }
    
    private var backgroundColor: Color {
        switch state {
        case .synced: return Color.tallySuccess.opacity(0.1)
        case .pending: return Color.tallyWarning.opacity(0.1)
        case .syncing: return Color.tallyPaperTint
        case .failed: return Color.tallyError.opacity(0.1)
        case .offline: return Color.tallyPaperTint
        }
    }
}

struct LoadingStateView: View {
    var body: some View {
        VStack(spacing: TallySpacing.lg) {
            ProgressView()
                .scaleEffect(1.2)
            
            Text("Loading challenges…")
                .font(.tallyBodyMedium)
                .foregroundColor(Color.tallyInkSecondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct ErrorStateView: View {
    let message: String
    let onRetry: () -> Void
    
    var body: some View {
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
            
            Button("Try Again", action: onRetry)
                .buttonStyle(.borderedProminent)
                .tint(Color.tallyAccent)
        }
        .tallyPadding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct EmptyStateView: View {
    let onCreateChallenge: () -> Void
    
    var body: some View {
        VStack(spacing: TallySpacing.lg) {
            // Tally mark illustration
            TallyMarkView(count: 5, size: 80)
            
            Text("No challenges yet")
                .font(.tallyTitleMedium)
                .foregroundColor(Color.tallyInk)
            
            Text("Create your first challenge and start tracking your progress.")
                .font(.tallyBodyMedium)
                .foregroundColor(Color.tallyInkSecondary)
                .multilineTextAlignment(.center)
            
            Button {
                onCreateChallenge()
            } label: {
                Label("Create Challenge", systemImage: "plus")
                    .font(.tallyTitleSmall)
            }
            .buttonStyle(.borderedProminent)
            .tint(Color.tallyAccent)
            .tallyPadding(.top, TallySpacing.sm)
        }
        .tallyPadding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview("List") {
    NavigationStack {
        ChallengeListView(
            manager: ChallengesManager(),
            onSelectChallenge: { _ in },
            onCreateChallenge: {},
            onQuickAdd: { _ in }
        )
        .navigationTitle("Challenges")
    }
}

#Preview("Empty") {
    EmptyStateView(onCreateChallenge: {})
}

#Preview("Error") {
    ErrorStateView(message: "Could not connect to server", onRetry: {})
}
