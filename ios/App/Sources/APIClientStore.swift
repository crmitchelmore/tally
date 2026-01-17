import Foundation
import TallyCore
import TallyFeatureAPIClient

@MainActor
final class APIClientStore: ObservableObject {
    @Published private(set) var syncStatus: SyncStatus = .offline
    @Published private(set) var lastError: String?
    @Published private(set) var challenges: [Challenge] = []
    @Published private(set) var entries: [Entry] = []

    private let client: APIClientProviding
    private let cache: APIClientCache
    private var pendingWrites: [QueuedWrite] = []

    init(
        client: APIClientProviding,
        cache: APIClientCache = .init()
    ) {
        self.client = client
        self.cache = cache
        self.pendingWrites = cache.loadQueue()
        self.challenges = cache.loadChallenges()
        self.entries = cache.loadEntries()
        self.syncStatus = pendingWrites.isEmpty ? .offline : .queued(pendingWrites.count)
    }

    var apiClient: APIClientProviding { client }

    func refresh(activeOnly: Bool = true) async {
        syncStatus = .syncing
        do {
            let challenges = try await client.fetchChallenges(activeOnly: activeOnly)
            let entries = try await client.fetchEntries(challengeId: nil, date: nil)
            self.challenges = challenges
            self.entries = entries
            cache.saveChallenges(challenges)
            cache.saveEntries(entries)
            syncStatus = pendingWrites.isEmpty ? .upToDate : .queued(pendingWrites.count)
            lastError = nil
        } catch {
            syncStatus = pendingWrites.isEmpty ? .offline : .queued(pendingWrites.count)
            lastError = error.localizedDescription
        }
    }

    func enqueueChallenge(_ request: ChallengeCreateRequest) async {
        pendingWrites.append(.createChallenge(request))
        cache.saveQueue(pendingWrites)
        syncStatus = .queued(pendingWrites.count)
    }

    func enqueueEntry(_ request: EntryCreateRequest) async {
        pendingWrites.append(.createEntry(request))
        cache.saveQueue(pendingWrites)
        syncStatus = .queued(pendingWrites.count)
    }

    func syncQueuedWrites() async {
        guard !pendingWrites.isEmpty else {
            syncStatus = .upToDate
            return
        }
        syncStatus = .syncing
        do {
            try await processQueue()
            cache.saveQueue(pendingWrites)
            lastError = nil
            await refresh(activeOnly: true)
        } catch {
            syncStatus = .failed
            lastError = error.localizedDescription
        }
    }

    private func processQueue() async throws {
        var remaining: [QueuedWrite] = []
        for write in pendingWrites {
            do {
                switch write {
                case .createChallenge(let request):
                    _ = try await client.createChallenge(request)
                case .createEntry(let request):
                    _ = try await client.createEntry(request)
                case .deleteChallenge(let id):
                    _ = try await client.deleteChallenge(id: id)
                }
            } catch {
                remaining.append(write)
            }
        }
        pendingWrites = remaining
    }
}

enum QueuedWrite: Codable, Equatable, Sendable {
    case createChallenge(ChallengeCreateRequest)
    case createEntry(EntryCreateRequest)
    case deleteChallenge(id: String)
}

final class APIClientCache {
    private let challengesKey = "tally.api.challenges"
    private let entriesKey = "tally.api.entries"
    private let queueKey = "tally.api.queue"
    private let storage = UserDefaults.standard
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    func loadChallenges() -> [Challenge] {
        decode([Challenge].self, key: challengesKey) ?? []
    }

    func loadEntries() -> [Entry] {
        decode([Entry].self, key: entriesKey) ?? []
    }

    func loadQueue() -> [QueuedWrite] {
        decode([QueuedWrite].self, key: queueKey) ?? []
    }

    func saveChallenges(_ challenges: [Challenge]) {
        encode(challenges, key: challengesKey)
    }

    func saveEntries(_ entries: [Entry]) {
        encode(entries, key: entriesKey)
    }

    func saveQueue(_ queue: [QueuedWrite]) {
        encode(queue, key: queueKey)
    }

    private func encode<T: Encodable>(_ value: T, key: String) {
        guard let data = try? encoder.encode(value) else {
            return
        }
        storage.set(data, forKey: key)
    }

    private func decode<T: Decodable>(_ type: T.Type, key: String) -> T? {
        guard let data = storage.data(forKey: key) else {
            return nil
        }
        return try? decoder.decode(type, from: data)
    }
}
