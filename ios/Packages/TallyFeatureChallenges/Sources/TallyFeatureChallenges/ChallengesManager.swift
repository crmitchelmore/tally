import Foundation
import SwiftUI
import TallyCore
import TallyFeatureAPIClient
import TallyFeatureAuth

/// Observable state manager for challenges with offline-first behavior
@MainActor
@Observable
public final class ChallengesManager {
    // MARK: - State
    
    /// Current list of challenges with stats
    public private(set) var challengesWithStats: [(challenge: Challenge, stats: ChallengeStats)] = []
    
    /// Dashboard stats
    public private(set) var dashboardStats: DashboardStats?
    
    /// Personal records
    public private(set) var personalRecords: PersonalRecords?
    
    /// All entries (for charts/heatmap)
    public private(set) var allEntries: [Entry] = []
    
    /// Overall sync state
    public private(set) var syncState: SyncState = .synced
    
    /// Loading state for initial fetch
    public private(set) var isLoading: Bool = false
    
    /// Error message if something went wrong
    public private(set) var errorMessage: String?
    
    /// Whether we're currently connected to the network
    public private(set) var isOnline: Bool = true
    
    // MARK: - Convenience accessors
    
    /// Current list of challenges (for backward compatibility)
    public var challenges: [Challenge] {
        challengesWithStats.map { $0.challenge }
    }
    
    /// Get stats for a challenge
    public func stats(for challengeId: String) -> ChallengeStats? {
        challengesWithStats.first { $0.challenge.id == challengeId }?.stats
    }
    
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
        let cachedChallenges = localStore.loadChallenges()
        // Initially show challenges without stats until we fetch from server
        self.challengesWithStats = cachedChallenges.map { challenge in
            (challenge, defaultStats(for: challenge))
        }
        updateSyncState()
    }
    
    /// Create default stats for a challenge when offline
    private func defaultStats(for challenge: Challenge) -> ChallengeStats {
        ChallengeStats(
            challengeId: challenge.id,
            totalCount: 0,
            remaining: challenge.target,
            daysElapsed: 0,
            daysRemaining: 365,
            perDayRequired: Double(challenge.target) / 365.0,
            currentPace: 0,
            paceStatus: .none,
            streakCurrent: 0,
            streakBest: 0,
            bestDay: nil,
            dailyAverage: 0
        )
    }
    
    // MARK: - Public API
    
    /// Refresh challenges from server (called on app launch, pull-to-refresh)
    public func refresh() async {
        isLoading = challengesWithStats.isEmpty
        errorMessage = nil
        
        // In local-only mode, skip API calls entirely
        let isLocalOnly = AuthManager.shared.isLocalOnlyMode || 
            CommandLine.arguments.contains("--offline-mode")
        
        if isLocalOnly {
            isOnline = false
            syncState = .offline
            isLoading = false
            return
        }
        
        do {
            // Fetch challenges with stats in one call
            let serverData = try await apiClient.listChallengesWithStats(includeArchived: true)
            
            // Update local store and state
            for item in serverData {
                localStore.upsertChallenge(item.challenge)
            }
            
            challengesWithStats = serverData.map { ($0.challenge, $0.stats) }
            isOnline = true
            
            // Fetch dashboard stats and personal records
            let (stats, records) = try await apiClient.getDashboardData()
            dashboardStats = stats
            personalRecords = records
            
            // Fetch all entries for charts
            allEntries = try await apiClient.listEntries()
            
            // Try to sync any pending changes
            await syncPendingChanges()
        } catch let error as APIError {
            #if DEBUG
            print("[ChallengesManager] API error: \(error)")
            #endif
            if error.isRecoverable {
                isOnline = false
                syncState = .offline
            } else {
                errorMessage = error.errorDescription
            }
        } catch {
            #if DEBUG
            print("[ChallengesManager] Error: \(error)")
            #endif
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
        isPublic: Bool = false,
        countType: CountType = .simple,
        unitLabel: String? = nil,
        defaultIncrement: Int = 1
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
            countType: countType,
            unitLabel: unitLabel,
            defaultIncrement: defaultIncrement,
            createdAt: now,
            updatedAt: now
        )
        
        localStore.upsertChallenge(challenge)
        localStore.addPendingChange(.create(id: tempId))
        
        // Add to state with default stats
        challengesWithStats.append((challenge, defaultStats(for: challenge)))
        updateSyncState()
        
        // Try to sync immediately if online
        if isOnline {
            await syncPendingChanges()
            await refresh() // Refresh to get actual stats
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
        guard let index = challengesWithStats.firstIndex(where: { $0.challenge.id == id }) else { return }
        let existing = challengesWithStats[index].challenge
        
        // Create updated challenge
        let updated = Challenge(
            id: existing.id,
            userId: existing.userId,
            name: name ?? existing.name,
            target: target ?? existing.target,
            timeframeType: existing.timeframeType,
            startDate: existing.startDate,
            endDate: existing.endDate,
            color: color ?? existing.color,
            icon: icon ?? existing.icon,
            isPublic: isPublic ?? existing.isPublic,
            isArchived: isArchived ?? existing.isArchived,
            countType: existing.countType,
            unitLabel: existing.unitLabel,
            createdAt: existing.createdAt,
            updatedAt: ISO8601DateFormatter().string(from: Date())
        )
        
        localStore.upsertChallenge(updated)
        localStore.addPendingChange(.update(id: id))
        
        // Update state keeping existing stats
        let existingStats = challengesWithStats[index].stats
        challengesWithStats[index] = (updated, existingStats)
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
        challengesWithStats.removeAll { $0.challenge.id == id }
        updateSyncState()
        
        if isOnline {
            await syncPendingChanges()
        }
    }
    
    /// Get challenge by ID
    public func challenge(id: String) -> Challenge? {
        challengesWithStats.first { $0.challenge.id == id }?.challenge
    }
    
    /// Active (non-archived) challenges with stats
    public var activeChallengesWithStats: [(challenge: Challenge, stats: ChallengeStats)] {
        challengesWithStats.filter { !$0.challenge.isArchived }
    }
    
    /// Active (non-archived) challenges
    public var activeChallenges: [Challenge] {
        challengesWithStats.filter { !$0.challenge.isArchived }.map { $0.challenge }
    }
    
    /// Archived challenges
    public var archivedChallenges: [Challenge] {
        challengesWithStats.filter { $0.challenge.isArchived }.map { $0.challenge }
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
                            isPublic: local.isPublic,
                            countType: local.countType,
                            unitLabel: local.unitLabel,
                            defaultIncrement: local.defaultIncrement
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
        
        // Reload from local store
        let cachedChallenges = localStore.loadChallenges()
        // Keep existing stats where available
        var updatedWithStats: [(Challenge, ChallengeStats)] = []
        for challenge in cachedChallenges {
            if let existingStats = stats(for: challenge.id) {
                updatedWithStats.append((challenge, existingStats))
            } else {
                updatedWithStats.append((challenge, defaultStats(for: challenge)))
            }
        }
        challengesWithStats = updatedWithStats
        
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
        challengesWithStats = []
        dashboardStats = nil
        personalRecords = nil
        allEntries = []
        syncState = .synced
    }
}
