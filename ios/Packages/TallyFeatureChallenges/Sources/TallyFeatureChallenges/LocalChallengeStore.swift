import Foundation
import TallyFeatureAPIClient

/// Local persistence for challenges using UserDefaults + file storage
/// Provides offline-first capability with sync state tracking
public final class LocalChallengeStore: @unchecked Sendable {
    public static let shared = LocalChallengeStore()
    
    private let challengesKey = "tally.challenges.data"
    private let pendingChangesKey = "tally.challenges.pending"
    private let defaults: UserDefaults
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder
    
    private let queue = DispatchQueue(label: "com.tally.localchallengestore", qos: .userInitiated)
    
    public init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        self.encoder = JSONEncoder()
        self.encoder.keyEncodingStrategy = .convertToSnakeCase
        self.decoder = JSONDecoder()
        self.decoder.keyDecodingStrategy = .convertFromSnakeCase
    }
    
    // MARK: - Challenges CRUD
    
    /// Load all locally stored challenges
    public func loadChallenges() -> [Challenge] {
        queue.sync {
            guard let data = defaults.data(forKey: challengesKey) else { return [] }
            return (try? decoder.decode([Challenge].self, from: data)) ?? []
        }
    }
    
    /// Save challenges to local storage
    public func saveChallenges(_ challenges: [Challenge]) {
        queue.sync {
            guard let data = try? encoder.encode(challenges) else { return }
            defaults.set(data, forKey: challengesKey)
        }
    }
    
    /// Get a single challenge by ID
    public func getChallenge(id: String) -> Challenge? {
        loadChallenges().first { $0.id == id }
    }
    
    /// Add or update a challenge locally
    public func upsertChallenge(_ challenge: Challenge) {
        var challenges = loadChallenges()
        if let index = challenges.firstIndex(where: { $0.id == challenge.id }) {
            challenges[index] = challenge
        } else {
            challenges.append(challenge)
        }
        saveChallenges(challenges)
    }
    
    /// Remove a challenge from local storage
    public func removeChallenge(id: String) {
        var challenges = loadChallenges()
        challenges.removeAll { $0.id == id }
        saveChallenges(challenges)
    }
    
    // MARK: - Pending Changes Queue
    
    /// Load pending changes that need to be synced
    public func loadPendingChanges() -> [PendingChange] {
        queue.sync {
            guard let data = defaults.data(forKey: pendingChangesKey) else { return [] }
            return (try? decoder.decode([PendingChange].self, from: data)) ?? []
        }
    }
    
    /// Save pending changes
    public func savePendingChanges(_ changes: [PendingChange]) {
        queue.sync {
            guard let data = try? encoder.encode(changes) else { return }
            defaults.set(data, forKey: pendingChangesKey)
        }
    }
    
    /// Add a change to the pending queue
    public func addPendingChange(_ change: PendingChange) {
        var changes = loadPendingChanges()
        // Dedupe: remove existing changes for the same challenge
        changes.removeAll { $0.challengeId == change.challengeId }
        changes.append(change)
        savePendingChanges(changes)
    }
    
    /// Remove a change from the pending queue
    public func removePendingChange(for challengeId: String) {
        var changes = loadPendingChanges()
        changes.removeAll { $0.challengeId == challengeId }
        savePendingChanges(changes)
    }
    
    /// Clear all pending changes
    public func clearPendingChanges() {
        savePendingChanges([])
    }
    
    // MARK: - Utilities
    
    /// Merge server challenges with local data
    /// Keeps local pending changes, updates synced items
    public func mergeWithServer(_ serverChallenges: [Challenge]) {
        let pendingIds = Set(loadPendingChanges().map { $0.challengeId })
        var merged: [Challenge] = []
        
        // Add server challenges, but keep local versions if pending
        for serverChallenge in serverChallenges {
            if pendingIds.contains(serverChallenge.id),
               let local = getChallenge(id: serverChallenge.id) {
                merged.append(local)
            } else {
                merged.append(serverChallenge)
            }
        }
        
        // Add any local-only challenges (created offline)
        let serverIds = Set(serverChallenges.map { $0.id })
        let localChallenges = loadChallenges()
        for local in localChallenges where !serverIds.contains(local.id) && pendingIds.contains(local.id) {
            merged.append(local)
        }
        
        saveChallenges(merged)
    }
    
    /// Clear all local data (for logout)
    public func clearAll() {
        queue.sync {
            defaults.removeObject(forKey: challengesKey)
            defaults.removeObject(forKey: pendingChangesKey)
        }
    }
}
