import Foundation
import TallyFeatureAPIClient

/// Local persistence for entries using UserDefaults
/// Provides offline-first capability with sync state tracking
public final class LocalEntryStore: @unchecked Sendable {
    public static let shared = LocalEntryStore()
    
    private let entriesKey = "tally.entries.data"
    private let pendingChangesKey = "tally.entries.pending"
    private let defaults: UserDefaults
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder
    
    private let queue = DispatchQueue(label: "com.tally.localentrystore", qos: .userInitiated)
    
    public init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        self.encoder = JSONEncoder()
        self.encoder.keyEncodingStrategy = .convertToSnakeCase
        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
    }
    
    // MARK: - Entries CRUD
    
    /// Load all locally stored entries
    public func loadEntries() -> [Entry] {
        queue.sync {
            guard let data = defaults.data(forKey: entriesKey) else { return [] }
            return (try? decoder.decode([Entry].self, from: data)) ?? []
        }
    }
    
    /// Load entries for a specific challenge
    public func loadEntries(forChallenge challengeId: String) -> [Entry] {
        loadEntries().filter { $0.challengeId == challengeId }
    }
    
    /// Save entries to local storage
    public func saveEntries(_ entries: [Entry]) {
        queue.sync {
            guard let data = try? encoder.encode(entries) else { return }
            defaults.set(data, forKey: entriesKey)
        }
    }
    
    /// Get a single entry by ID
    public func getEntry(id: String) -> Entry? {
        loadEntries().first { $0.id == id }
    }
    
    /// Add or update an entry locally
    public func upsertEntry(_ entry: Entry) {
        var entries = loadEntries()
        if let index = entries.firstIndex(where: { $0.id == entry.id }) {
            entries[index] = entry
        } else {
            entries.append(entry)
        }
        saveEntries(entries)
    }
    
    /// Remove an entry from local storage
    public func removeEntry(id: String) {
        var entries = loadEntries()
        entries.removeAll { $0.id == id }
        saveEntries(entries)
    }
    
    // MARK: - Pending Changes Queue
    
    /// Load pending changes that need to be synced
    public func loadPendingChanges() -> [EntryPendingChange] {
        queue.sync {
            guard let data = defaults.data(forKey: pendingChangesKey) else { return [] }
            return (try? decoder.decode([EntryPendingChange].self, from: data)) ?? []
        }
    }
    
    /// Save pending changes
    public func savePendingChanges(_ changes: [EntryPendingChange]) {
        queue.sync {
            guard let data = try? encoder.encode(changes) else { return }
            defaults.set(data, forKey: pendingChangesKey)
        }
    }
    
    /// Add a change to the pending queue
    public func addPendingChange(_ change: EntryPendingChange) {
        var changes = loadPendingChanges()
        // Dedupe: remove existing changes for the same entry
        changes.removeAll { $0.entryId == change.entryId }
        changes.append(change)
        savePendingChanges(changes)
    }
    
    /// Remove a change from the pending queue
    public func removePendingChange(for entryId: String) {
        var changes = loadPendingChanges()
        changes.removeAll { $0.entryId == entryId }
        savePendingChanges(changes)
    }
    
    /// Clear all pending changes
    public func clearPendingChanges() {
        savePendingChanges([])
    }
    
    // MARK: - Utilities
    
    /// Merge server entries with local data
    /// Keeps local pending changes, updates synced items
    public func mergeWithServer(_ serverEntries: [Entry], forChallenge challengeId: String) {
        let pendingIds = Set(loadPendingChanges().map { $0.entryId })
        var allEntries = loadEntries()
        
        // Remove old entries for this challenge (except pending ones)
        allEntries.removeAll { entry in
            entry.challengeId == challengeId && !pendingIds.contains(entry.id)
        }
        
        // Add server entries (but keep local versions if pending)
        for serverEntry in serverEntries {
            if pendingIds.contains(serverEntry.id) {
                // Keep local version
                continue
            } else {
                allEntries.append(serverEntry)
            }
        }
        
        // Local-only entries (created offline) are already in allEntries if pending
        
        saveEntries(allEntries)
    }
    
    /// Clear all local data (for logout)
    public func clearAll() {
        queue.sync {
            defaults.removeObject(forKey: entriesKey)
            defaults.removeObject(forKey: pendingChangesKey)
        }
    }
}

/// Types of entry changes that can be queued for sync
public enum EntryPendingChange: Codable, Sendable {
    case create(id: String, request: CreateEntryRequest)
    case update(id: String, request: UpdateEntryRequest)
    case delete(id: String)
    
    var entryId: String {
        switch self {
        case .create(let id, _), .update(let id, _), .delete(let id):
            return id
        }
    }
}
