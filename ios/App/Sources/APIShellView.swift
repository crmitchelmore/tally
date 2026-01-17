import SwiftUI
import TallyCore
import TallyFeatureAPIClient

struct APIShellView: View {
    @ObservedObject var store: APIClientStore
    let onSignOut: @Sendable () async -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                headerCard
                statusCard
                challengesPreview
                entriesPreview
                actions
            }
            .padding(24)
        }
    }

    private var headerCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Sync-ready API")
                .font(.title2.weight(.semibold))
            Text("Your data is cached locally and queued writes sync when you are back online.")
                .font(.callout)
                .foregroundStyle(.secondary)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.08), radius: 16, y: 8)
        )
    }

    private var statusCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Sync status")
                .font(.headline)
            Text(syncDescription)
                .font(.callout)
                .foregroundStyle(.secondary)
            if let error = store.lastError {
                Text(error)
                    .font(.footnote)
                    .foregroundStyle(Color(red: 0.7, green: 0.15, blue: 0.15))
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color(.systemBackground))
        )
    }

    private var challengesPreview: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Challenges")
                .font(.headline)
            if store.challenges.isEmpty {
                Text("No challenges cached yet. Once you create a challenge, it will stay available offline.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(store.challenges.prefix(3), id: \.id) { challenge in
                    HStack {
                        Circle()
                            .fill(Color(red: 0.75, green: 0.07, blue: 0.07))
                            .frame(width: 10, height: 10)
                        Text(challenge.name)
                            .font(.callout.weight(.medium))
                        Spacer()
                        Text("\(challenge.targetNumber)")
                            .font(.callout)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color(.systemBackground))
        )
    }

    private var entriesPreview: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent entries")
                .font(.headline)
            if store.entries.isEmpty {
                Text("Entries logged on the web will appear here and stay cached for offline review.")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            } else {
                ForEach(store.entries.prefix(3), id: \.id) { entry in
                    HStack {
                        Text(entry.date)
                            .font(.callout.weight(.medium))
                        Spacer()
                        Text("+\(entry.count)")
                            .font(.callout)
                    }
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color(.systemBackground))
        )
    }

    private var actions: some View {
        VStack(spacing: 12) {
            Button {
                Task {
                    await store.refresh(activeOnly: true)
                }
            } label: {
                Text("Refresh from server")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)

            Button {
                Task {
                    await store.syncQueuedWrites()
                }
            } label: {
                Text("Sync queued writes")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)

            Button(role: .destructive) {
                Task {
                    await onSignOut()
                }
            } label: {
                Text("Sign out")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
        }
    }

    private var syncDescription: String {
        switch store.syncStatus {
        case .offline:
            return "Offline. Viewing cached data."
        case .syncing:
            return "Syncing with the server."
        case .queued(let count):
            return "\(count) updates queued to sync."
        case .upToDate:
            return "All caught up."
        case .failed:
            return "Sync failed. Try again when you are online."
        }
    }
}

#Preview {
    APIShellView(
        store: APIClientStore(
            client: TallyFeatureAPIClient.APIClient(
                baseURL: URL(string: "https://example.com")!,
                tokenProvider: { "token" }
            )
        ),
        onSignOut: {}
    )
    .preferredColorScheme(.light)
}
