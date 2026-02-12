import Foundation

/// Shared data store using App Groups for widget access
/// Provides offline-first cached data for widgets
public final class WidgetDataStore: @unchecked Sendable {
    
    /// App Group identifier - must match entitlements
    public static let appGroupIdentifier = "group.app.tally.shared"
    
    /// Key for storing widget challenges
    private static let challengesKey = "widget.challenges"
    
    /// Key for last sync timestamp
    private static let lastSyncKey = "widget.lastSync"
    
    /// Shared instance
    public static let shared = WidgetDataStore()
    
    private let defaults: UserDefaults?
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder
    
    public init() {
        self.defaults = UserDefaults(suiteName: Self.appGroupIdentifier)
        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
    }
    
    // MARK: - Challenges
    
    /// Load cached challenges for widget display
    public func loadChallenges() -> [WidgetChallenge] {
        guard let defaults = defaults,
              let data = defaults.data(forKey: Self.challengesKey),
              let challenges = try? decoder.decode([WidgetChallenge].self, from: data) else {
            return []
        }
        return challenges
    }
    
    /// Save challenges to shared container (called by main app)
    public func saveChallenges(_ challenges: [WidgetChallenge]) {
        guard let defaults = defaults,
              let data = try? encoder.encode(challenges) else {
            return
        }
        defaults.set(data, forKey: Self.challengesKey)
        defaults.set(Date(), forKey: Self.lastSyncKey)
    }
    
    /// Get a specific challenge by ID
    public func getChallenge(id: String) -> WidgetChallenge? {
        loadChallenges().first { $0.id == id }
    }
    
    /// Get the most recently active challenges (for small/medium widgets)
    public func getTopChallenges(limit: Int = 3) -> [WidgetChallenge] {
        let challenges = loadChallenges()
            .filter { !$0.isComplete }
            .sorted { $0.lastUpdated > $1.lastUpdated }
        return Array(challenges.prefix(limit))
    }
    
    /// Get a single featured challenge (for small widget)
    public func getFeaturedChallenge() -> WidgetChallenge? {
        // Return the most recently updated non-complete challenge
        loadChallenges()
            .filter { !$0.isComplete }
            .sorted { $0.lastUpdated > $1.lastUpdated }
            .first
    }
    
    // MARK: - Sync Status
    
    /// Get the last time data was synced
    public var lastSyncDate: Date? {
        defaults?.object(forKey: Self.lastSyncKey) as? Date
    }
    
    /// Check if data is stale (older than 1 hour)
    public var isDataStale: Bool {
        guard let lastSync = lastSyncDate else { return true }
        return Date().timeIntervalSince(lastSync) > 3600
    }
    
    // MARK: - Clear
    
    /// Clear all widget data
    public func clearAll() {
        defaults?.removeObject(forKey: Self.challengesKey)
        defaults?.removeObject(forKey: Self.lastSyncKey)
    }
}
