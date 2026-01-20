import Foundation
import SwiftUI
import TallyCore
import TallyFeatureAPIClient

/// Observable state manager for challenges with offline-first behavior
@MainActor
@Observable
public final class ChallengesManager {
    // MARK: - State
    
    /// Current list of challenges
    public private(set) var challenges: [Challenge] = []
    
    /// Overall sync state
    public private(set) var syncState: SyncState = .synced
    
    /// Loading state for initial fetch
    public private(set) var isLoading: Bool = false
    
    /// Error message if something went wrong
    public private(set) var errorMessage: String?
    
    /// Whether we're currently connected to the network
    public private(set) var isOnline: Bool = true
    
    // MARK: - Dependencies
    
    private let apiClient: APIClient
    private let localStore: LocalChallengeStore
    
    // MARK: - Initialization
    
    public init(
        apiClient: APIClient = .shared,
        localStore: LocalChallengeStore = .shared
    ) {
        self.apiClient = apiClient
        self.localStore = localStore
        
        // Load cached data immediately
        self.challenges = localStore.loadChallenges()
        updateSyncState()
    }
    
    // MARK: - Public API
    
    /// Refresh challenges from server (called on app launch, pull-to-refresh)
    public func refresh() async {
        isLoading = challenges.isEmpty
        errorMessage = nil
        
        do {
            let serverChallenges = try await apiClient.listChallenges(includeArchived: true)
            localStore.mergeWithServer(serverChallenges)
            challenges = localStore.loadChallenges()
            isOnline = true
            
            // Try to sync any pending changes
            await syncPendingChanges()
        } catch let error as APIError {
            if error.isRecoverable {
                isOnline = false
                syncState = .offline
            } else {
                errorMessage = error.errorDescription
            }
        } catch {
            isOnline = false
            syncState = .offline
        }
        
        isLoading = false
        updateSyncState()
    }
    
    /// Create a new challenge (optimistic, queues for sync)
    public func createChallenge(
        name: String,
        target: Int,
        timeframeType: TimeframeType,
        startDate: Date,
        endDate: Date,
        color: String = "#4B5563",
        icon: String = "checkmark",
        isPublic: Bool = false
    ) async {
        let tempId = UUID().uuidString
        let now = ISO8601DateFormatter().string(from: Date())
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withFullDate]
        
        // Create local challenge immediately (optimistic)
        let challenge = Challenge(
            id: tempId,
            userId: "",  // Will be set by server
            name: name,
            target: target,
            timeframeType: timeframeType,
            startDate: dateFormatter.string(from: startDate),
            endDate: dateFormatter.string(from: endDate),
            color: color,
            icon: icon,
            isPublic: isPublic,
            isArchived: false,
            createdAt: now,
            updatedAt: now
        )
        
        localStore.upsertChallenge(challenge)
        localStore.addPendingChange(.create(id: tempId))
        challenges = localStore.loadChallenges()
        updateSyncState()
        
        // Try to sync immediately if online
        if isOnline {
            await syncPendingChanges()
        }
    }
    
    /// Update an existing challenge (optimistic)
    public func updateChallenge(
        id: String,
        name: String? = nil,
        target: Int? = nil,
        color: String? = nil,
        icon: String? = nil,
        isPublic: Bool? = nil,
        isArchived: Bool? = nil
    ) async {
        guard let challenge = localStore.getChallenge(id: id) else { return }
        
        // Create updated challenge
        let updated = Challenge(
            id: challenge.id,
            userId: challenge.userId,
            name: name ?? challenge.name,
            target: target ?? challenge.target,
            timeframeType: challenge.timeframeType,
            startDate: challenge.startDate,
            endDate: challenge.endDate,
            color: color ?? challenge.color,
            icon: icon ?? challenge.icon,
            isPublic: isPublic ?? challenge.isPublic,
            isArchived: isArchived ?? challenge.isArchived,
            createdAt: challenge.createdAt,
            updatedAt: ISO8601DateFormatter().string(from: Date())
        )
        
        localStore.upsertChallenge(updated)
        localStore.addPendingChange(.update(id: id))
        challenges = localStore.loadChallenges()
        updateSyncState()
        
        if isOnline {
            await syncPendingChanges()
        }
    }
    
    /// Archive a challenge
    public func archiveChallenge(id: String) async {
        await updateChallenge(id: id, isArchived: true)
    }
    
    /// Unarchive a challenge
    public func unarchiveChallenge(id: String) async {
        await updateChallenge(id: id, isArchived: false)
    }
    
    /// Delete a challenge (optimistic)
    public func deleteChallenge(id: String) async {
        localStore.removeChallenge(id: id)
        localStore.addPendingChange(.delete(id: id))
        challenges = localStore.loadChallenges()
        updateSyncState()
        
        if isOnline {
            await syncPendingChanges()
        }
    }
    
    /// Get challenge by ID
    public func challenge(id: String) -> Challenge? {
        challenges.first { $0.id == id }
    }
    
    /// Active (non-archived) challenges
    public var activeChallenges: [Challenge] {
        challenges.filter { !$0.isArchived }
    }
    
    /// Archived challenges
    public var archivedChallenges: [Challenge] {
        challenges.filter { $0.isArchived }
    }
    
    // MARK: - Private Helpers
    
    /// Sync all pending changes to server
    private func syncPendingChanges() async {
        let pendingChanges = localStore.loadPendingChanges()
        guard !pendingChanges.isEmpty else {
            syncState = .synced
            return
        }
        
        syncState = .syncing
        
        for change in pendingChanges {
            do {
                switch change {
                case .create(let id):
                    if let local = localStore.getChallenge(id: id) {
                        let request = CreateChallengeRequest(
                            name: local.name,
                            target: local.target,
                            timeframeType: local.timeframeType,
                            startDate: local.startDate,
                            endDate: local.endDate,
                            color: local.color,
                            icon: local.icon,
                            isPublic: local.isPublic
                        )
                        let serverChallenge = try await apiClient.createChallenge(request)
                        
                        // Replace temp ID with server ID
                        localStore.removeChallenge(id: id)
                        localStore.upsertChallenge(serverChallenge)
                        localStore.removePendingChange(for: id)
                    }
                    
                case .update(let id):
                    if let local = localStore.getChallenge(id: id) {
                        let request = UpdateChallengeRequest(
                            name: local.name,
                            target: local.target,
                            color: local.color,
                            icon: local.icon,
                            isPublic: local.isPublic,
                            isArchived: local.isArchived
                        )
                        let serverChallenge = try await apiClient.updateChallenge(id: id, data: request)
                        localStore.upsertChallenge(serverChallenge)
                        localStore.removePendingChange(for: id)
                    }
                    
                case .delete(let id):
                    try await apiClient.deleteChallenge(id: id)
                    localStore.removePendingChange(for: id)
                    
                case .archive(let id):
                    let serverChallenge = try await apiClient.archiveChallenge(id: id)
                    localStore.upsertChallenge(serverChallenge)
                    localStore.removePendingChange(for: id)
                }
                
            } catch let error as APIError {
                if !error.isRecoverable {
                    // Remove failed non-recoverable changes
                    localStore.removePendingChange(for: change.challengeId)
                }
                // Keep recoverable errors in queue for retry
            } catch {
                // Network errors - keep in queue for retry
            }
        }
        
        challenges = localStore.loadChallenges()
        updateSyncState()
    }
    
    /// Update sync state based on pending changes
    private func updateSyncState() {
        let pendingCount = localStore.loadPendingChanges().count
        
        if !isOnline {
            syncState = .offline
        } else if pendingCount > 0 {
            syncState = .pending(count: pendingCount)
        } else {
            syncState = .synced
        }
    }
    
    /// Clear all local data (for logout)
    public func clearLocalData() {
        localStore.clearAll()
        challenges = []
        syncState = .synced
    }
}
