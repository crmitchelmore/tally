import Foundation

/// Sync status for individual items or the overall store
public enum SyncState: Equatable, Sendable {
    /// No local changes, in sync with server
    case synced
    /// Local changes waiting to be synced
    case pending(count: Int)
    /// Currently syncing with server
    case syncing
    /// Failed to sync, will retry
    case failed(error: String)
    /// Offline, changes are local only
    case offline
    
    public var isOffline: Bool {
        if case .offline = self { return true }
        return false
    }
    
    public var hasPendingChanges: Bool {
        if case .pending = self { return true }
        return false
    }
    
    public var displayText: String {
        switch self {
        case .synced:
            return "Synced"
        case .pending(let count):
            return "\(count) pending"
        case .syncing:
            return "Syncing…"
        case .failed(let error):
            return "Sync failed: \(error)"
        case .offline:
            return "Offline"
        }
    }
}

/// Wrapper for items that tracks their sync status
public struct SyncableItem<T: Identifiable>: Identifiable, Equatable where T: Equatable {
    public let item: T
    public let syncState: SyncState
    public let localVersion: Int
    public let serverVersion: Int?
    
    public var id: T.ID { item.id }
    
    public var needsSync: Bool {
        switch syncState {
        case .pending, .failed:
            return true
        default:
            return false
        }
    }
    
    public init(
        item: T,
        syncState: SyncState = .synced,
        localVersion: Int = 0,
        serverVersion: Int? = nil
    ) {
        self.item = item
        self.syncState = syncState
        self.localVersion = localVersion
        self.serverVersion = serverVersion
    }
}

/// Types of changes that can be queued for sync
public enum PendingChange: Codable, Equatable, Sendable {
    case create(id: String)
    case update(id: String)
    case delete(id: String)
    case archive(id: String)
    
    var challengeId: String {
        switch self {
        case .create(let id), .update(let id), .delete(let id), .archive(let id):
            return id
        }
    }
}
