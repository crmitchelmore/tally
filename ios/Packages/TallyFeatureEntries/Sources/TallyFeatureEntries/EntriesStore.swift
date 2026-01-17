import Foundation
import TallyCore
import TallyFeatureAPIClient

@MainActor
public final class EntriesStore: ObservableObject, EntriesStoreProtocol {
    @Published public private(set) var entries: [Entry] = []
    @Published public private(set) var syncStatus: SyncStatus = .offline
    @Published public private(set) var lastError: String?

    private let apiClient: APIClientProviding
    private let cache: EntriesCache
    private var queue: [QueuedWrite] = []

    public init(apiClient: APIClientProviding, cache: EntriesCache = .init()) {
        self.apiClient = apiClient
        self.cache = cache
        self.queue = cache.loadQueue()
        self.entries = cache.loadEntries()
        self.syncStatus = queue.isEmpty ? .offline : .queued(queue.count)
    }

    public func refreshEntries(activeOnly: Bool = true) async {
        syncStatus = .syncing
        do {
            let entries = try await apiClient.fetchEntries(challengeId: nil, date: nil)
            self.entries = entries
            cache.saveEntries(entries)
            syncStatus = queue.isEmpty ? .upToDate : .queued(queue.count)
            lastError = nil
        } catch {
            syncStatus = queue.isEmpty ? .offline : .queued(queue.count)
            lastError = error.localizedDescription
        }
    }

    public func syncQueuedWrites() async {
        guard !queue.isEmpty else {
            syncStatus = .upToDate
            return
        }
        syncStatus = .syncing
        do {
            try await processQueue()
            cache.saveQueue(queue)
            lastError = nil
            await refreshEntries(activeOnly: true)
        } catch {
            syncStatus = .failed
            lastError = error.localizedDescription
        }
    }

    public func createEntry(_ request: EntryCreateRequest) async {
        do {
            let created = try await apiClient.createEntry(request)
            entries.insert(created, at: 0)
            cache.saveEntries(entries)
            lastError = nil
            await track(
                event: .entryCreated,
                properties: entryProperties(for: created),
                userId: created.userId
            )
        } catch {
            queue.append(.createEntry(request))
            cache.saveQueue(queue)
            syncStatus = .queued(queue.count)
            lastError = "Saved offline. We'll sync when you're online."
        }
    }

    public func updateEntry(id: String, _ request: EntryUpdateRequest) async {
        do {
            let updated = try await apiClient.updateEntry(id: id, request)
            replaceEntry(updated)
            lastError = nil
            await track(
                event: .entryUpdated,
                properties: entryProperties(for: updated),
                userId: updated.userId
            )
        } catch {
            queue.append(.updateEntry(id: id, request))
            cache.saveQueue(queue)
            syncStatus = .queued(queue.count)
            lastError = "Update queued to sync."
        }
    }

    public func deleteEntry(id: String) async {
        let existing = entries.first { $0.id == id }
        do {
            try await apiClient.deleteEntry(id: id)
        } catch {
            queue.append(.deleteEntry(id: id))
            cache.saveQueue(queue)
            syncStatus = .queued(queue.count)
            lastError = "Delete queued to sync."
        }
        entries.removeAll { $0.id == id }
        cache.saveEntries(entries)
        if let entry = existing {
            await track(
                event: .entryDeleted,
                properties: entryProperties(for: entry),
                userId: entry.userId
            )
        }
    }

    private func entryProperties(for entry: Entry) -> [String: String] {
        [
            "entry_id": entry.id,
            "challenge_id": entry.challengeId,
            "entry_count": "\(entry.count)",
            "has_note": entry.note == nil ? "false" : "true",
            "has_sets": entry.sets == nil ? "false" : "true",
            "feeling": entry.feeling ?? ""
        ]
    }

    private func track(event: TelemetryEvent, properties: [String: String], userId: String?) async {
        guard let contextProvider = TelemetryStore.shared.contextProvider,
              let client = TelemetryStore.shared.client else { return }
        let base = contextProvider()
        let context = TelemetryContext(
            platform: base.platform,
            env: base.env,
            appVersion: base.appVersion,
            buildNumber: base.buildNumber,
            userId: userId ?? base.userId,
            isSignedIn: true,
            sessionId: base.sessionId,
            traceId: base.traceId,
            spanId: base.spanId,
            requestId: base.requestId
        )
        await client.capture(event, properties: properties, context: context)
        await client.logWideEvent(event, properties: properties, context: context)
    }

    private func replaceEntry(_ updated: Entry) {
        if let index = entries.firstIndex(where: { $0.id == updated.id }) {
            entries[index] = updated
        } else {
            entries.insert(updated, at: 0)
        }
        cache.saveEntries(entries)
    }

    private func processQueue() async throws {
        var remaining: [QueuedWrite] = []
        for write in queue {
            do {
                switch write {
                case .createEntry(let request):
                    _ = try await apiClient.createEntry(request)
                case .updateEntry(let id, let request):
                    _ = try await apiClient.updateEntry(id: id, request)
                case .deleteEntry(let id):
                    _ = try await apiClient.deleteEntry(id: id)
                }
            } catch {
                remaining.append(write)
            }
        }
        queue = remaining
    }
}

public enum QueuedWrite: Codable, Equatable, Sendable {
    case createEntry(EntryCreateRequest)
    case updateEntry(id: String, EntryUpdateRequest)
    case deleteEntry(id: String)
}

public final class EntriesCache {
    private let entriesKey = "tally.entries"
    private let queueKey = "tally.entries.queue"
    private let storage = UserDefaults.standard
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    public init() {}

    public func loadEntries() -> [Entry] {
        decode([Entry].self, key: entriesKey) ?? []
    }

    public func loadQueue() -> [QueuedWrite] {
        decode([QueuedWrite].self, key: queueKey) ?? []
    }

    public func saveEntries(_ entries: [Entry]) {
        encode(entries, key: entriesKey)
    }

    public func saveQueue(_ queue: [QueuedWrite]) {
        encode(queue, key: queueKey)
    }

    private func encode<T: Encodable>(_ value: T, key: String) {
        guard let data = try? encoder.encode(value) else { return }
        storage.set(data, forKey: key)
    }

    private func decode<T: Decodable>(_ type: T.Type, key: String) -> T? {
        guard let data = storage.data(forKey: key) else { return nil }
        return try? decoder.decode(type, from: data)
    }
}
