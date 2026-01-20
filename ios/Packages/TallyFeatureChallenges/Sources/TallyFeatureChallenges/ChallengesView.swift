import SwiftUI
import TallyCore
import TallyFeatureAPIClient
import TallyFeatureEntries

#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

@available(iOS 17, macOS 13, *)
public struct ChallengesView<EntriesStoreType: EntriesStoreProtocol>: View {
    @ObservedObject private var store: ChallengesStore
    private let entriesStore: EntriesStoreType
    private let onSignOut: @Sendable () async -> Void
    @State private var isPresentingCreate = false
    @State private var selectedChallengeId: String?
    @State private var entriesChallengeId: String?

    public init(
        store: ChallengesStore,
        entriesStore: EntriesStoreType,
        onSignOut: @Sendable @escaping () async -> Void
    ) {
        self.store = store
        self.entriesStore = entriesStore
        self.onSignOut = onSignOut
    }

    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    headerCard
                    syncStatusCard
                    if store.state == .loading {
                        loadingCard
                    } else if store.challenges.isEmpty {
                        emptyCard
                    } else {
                        challengesGrid
                    }
                }
                .padding(20)
            }
            .navigationTitle("Challenges")
            .toolbar {
                #if canImport(UIKit)
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isPresentingCreate = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        entriesChallengeId = store.challenges.first?.id
                    } label: {
                        Image(systemName: "square.and.pencil")
                    }
                    .disabled(store.challenges.isEmpty)
                }
                ToolbarItem(placement: .topBarLeading) {
                    Button("Sign out") {
                        Task { await onSignOut() }
                    }
                }
                #else
                ToolbarItem(placement: .automatic) {
                    Button {
                        isPresentingCreate = true
                    } label: {
                        Image(systemName: "plus")
                    }
                }
                ToolbarItem(placement: .automatic) {
                    Button {
                        entriesChallengeId = store.challenges.first?.id
                    } label: {
                        Image(systemName: "square.and.pencil")
                    }
                    .disabled(store.challenges.isEmpty)
                }
                ToolbarItem(placement: .automatic) {
                    Button("Sign out") {
                        Task { await onSignOut() }
                    }
                }
                #endif
            }
        }
        .task {
            await store.refresh(activeOnly: true)
        }
        .sheet(isPresented: $isPresentingCreate) {
            ChallengeFormView(
                mode: .create,
                onSave: { draft in
                    await store.createChallenge(draft)
                }
            )
        }
        .sheet(item: selectedChallengeBinding) { selected in
            ChallengeDetailView(
                challenge: selected,
                entries: store.entriesForChallenge(selected.id),
                stats: store.stats(for: selected),
                onEdit: { draft in
                    await store.updateChallenge(id: selected.id, draft: draft)
                },
                onArchive: {
                    await store.archiveChallenge(id: selected.id)
                },
                onDelete: {
                    await store.deleteChallenge(id: selected.id)
                }
            )
        }
        .sheet(item: entriesChallengeBinding) { challenge in
            EntriesView(store: entriesStore, challenge: challenge)
        }
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Your tally boards")
                .font(.title2.weight(.semibold))
            Text("Create a focused challenge, track progress, and stay honest about pace.")
                .font(.callout)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(surfaceColor)
                .shadow(color: .black.opacity(0.08), radius: 16, y: 8)
        )
    }

    private var syncStatusCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Sync status")
                .font(.headline)
            Text(store.syncDescription)
                .font(.callout)
                .foregroundStyle(.secondary)
            if let error = store.lastError {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(Color(red: 0.7, green: 0.15, blue: 0.15))
            }
            if case .queued = store.syncStatus {
                Button("Sync queued writes") {
                    Task { await store.syncQueuedWrites() }
                }
                .buttonStyle(.bordered)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(surfaceColor)
                .shadow(color: .black.opacity(0.08), radius: 16, y: 8)
        )
    }

    private var loadingCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Loading challenges")
                .font(.headline)
            Text("Fetching the latest tally boards and cached entries.")
                .font(.callout)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(surfaceColor)
                .shadow(color: .black.opacity(0.08), radius: 16, y: 8)
        )
    }

    private var emptyCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("No challenges yet")
                .font(.headline)
            Text("Start your first challenge to see progress, pace, and streaks here.")
                .font(.callout)
                .foregroundStyle(.secondary)
            Button("Create challenge") {
                isPresentingCreate = true
            }
            .buttonStyle(.borderedProminent)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(surfaceColor)
                .shadow(color: .black.opacity(0.08), radius: 16, y: 8)
        )
    }

    private var challengesGrid: some View {
        LazyVStack(spacing: 16) {
            ForEach(store.challenges) { challenge in
                Button {
                    selectedChallengeId = challenge.id
                } label: {
                    ChallengeCardView(
                        challenge: challenge,
                        stats: store.stats(for: challenge),
                        totalCount: store.totalForChallenge(challenge.id)
                    )
                }
                .buttonStyle(.plain)
                .contextMenu {
                    Button("Log entries") {
                        entriesChallengeId = challenge.id
                    }
                }
            }
        }
    }

    private var selectedChallengeBinding: Binding<Challenge?> {
        Binding(
            get: {
                guard let selected = selectedChallengeId else { return nil }
                return store.challenges.first { $0.id == selected }
            },
            set: { newValue in
                selectedChallengeId = newValue?.id
            }
        )
    }

    private var entriesChallengeBinding: Binding<Challenge?> {
        Binding(
            get: {
                guard let selected = entriesChallengeId else { return nil }
                return store.challenges.first { $0.id == selected }
            },
            set: { newValue in
                entriesChallengeId = newValue?.id
            }
        )
    }

}

private var surfaceColor: Color {
#if canImport(UIKit)
    return Color(uiColor: .systemBackground)
#elseif canImport(AppKit)
    return Color(nsColor: .windowBackgroundColor)
#else
    return Color.white
#endif
}

#Preview {
    let client = APIClient(
        baseURL: URL(string: "https://example.com")!,
        tokenProvider: { "token" }
    )
    let store = ChallengesStore(apiClient: client)
    return ChallengesView(
        store: store,
        entriesStore: EntriesStore(apiClient: client),
        onSignOut: {}
    )
    .preferredColorScheme(.light)
}
