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
    
    /// Stats for each challenge (keyed by challenge ID)
    public private(set) var stats: [String: ChallengeStats] = [:]
    
    /// Overall sync state
    public private(set) var syncState: SyncState = .synced
    
    /// Loading state for initial fetch (only true when no cached data)
    public private(set) var isLoading: Bool = false
    
    /// Whether a background refresh is in progress (data shown, refreshing in background)
    public private(set) var isRefreshing: Bool = false
    
    /// Error message if something went wrong
    public private(set) var errorMessage: String?
    
    /// Whether we're currently connected to the network
    public private(set) var isOnline: Bool = true
    
    /// Dashboard stats computed from all challenges
    public var dashboardStats: DashboardStats? {
        guard !challenges.isEmpty else { return nil }
        
        let allStats = stats.values
        let totalMarks = allStats.reduce(0) { $0 + $1.totalCount }
        let today = allStats.reduce(0) { sum, stat in
            // Estimate today's count from daily average (rough approximation)
            sum + Int(stat.dailyAverage)
        }
        let bestStreak = allStats.map { $0.streakBest }.max() ?? 0
        
        // Overall pace status - use worst performing challenge
        // Priority: behind > none > onPace > ahead (lower index = worse)
        let paceOrder: [PaceStatus] = [.behind, .none, .onPace, .ahead]
        let overallPaceStatus = allStats.map { $0.paceStatus }.min(by: { a, b in
            (paceOrder.firstIndex(of: a) ?? 0) < (paceOrder.firstIndex(of: b) ?? 0)
        }) ?? .none
        
        return DashboardStats(
            totalMarks: totalMarks,
            today: today,
            bestStreak: bestStreak,
            overallPaceStatus: overallPaceStatus
        )
    }
    
    /// Personal records computed from all challenges
    public var personalRecords: PersonalRecords? {
        guard !challenges.isEmpty else { return nil }
        
        let allStats = stats.values
        let longestStreak = allStats.map { $0.streakBest }.max() ?? 0
        let mostActiveDays = allStats.map { $0.streakCurrent }.max() ?? 0
        
        // Find best single day across challenges
        var bestSingleDay: PersonalRecords.BestDay? = nil
        for stat in allStats {
            if let best = stat.bestDay {
                if bestSingleDay == nil || best.count > (bestSingleDay?.count ?? 0) {
                    bestSingleDay = PersonalRecords.BestDay(date: best.date, count: best.count)
                }
            }
        }
        
        return PersonalRecords(
            bestSingleDay: bestSingleDay,
            longestStreak: longestStreak,
            highestDailyAverage: nil,
            mostActiveDays: mostActiveDays,
            biggestSingleEntry: nil,
            bestSet: nil,
            avgSetValue: nil
        )
    }
    
    /// All entries across all challenges
    public var allEntries: [Entry] {
        localEntryStore.loadEntries()
    }
    
    // MARK: - Dependencies
    
    private let apiClient: APIClient
    private let localStore: LocalChallengeStore
    private let localEntryStore: LocalEntryStore
    
    // MARK: - Initialization
    
    public init(
        apiClient: APIClient = .shared,
        localStore: LocalChallengeStore = .shared,
        localEntryStore: LocalEntryStore = .shared
    ) {
        self.apiClient = apiClient
        self.localStore = localStore
        self.localEntryStore = localEntryStore
        
        // Load cached data immediately - this is synchronous
        self.challenges = localStore.loadChallenges()
        self.stats = localStore.loadStats()
        updateSyncState()
    }
    
    // MARK: - Public API
    
    /// Get stats for a specific challenge
    public func stats(for challengeId: String) -> ChallengeStats? {
        stats[challengeId]
    }
    
    /// Refresh challenges from server (called on app launch, pull-to-refresh)
    public func refresh() async {
        // Only show loading spinner if we have no cached data
        // Otherwise just refresh silently in background
        if challenges.isEmpty {
            isLoading = true
        } else {
            isRefreshing = true
        }
        errorMessage = nil
        
        do {
            let serverData = try await apiClient.listChallenges(includeArchived: true)
            localStore.mergeWithServer(serverData)
            challenges = localStore.loadChallenges()
            stats = localStore.loadStats()
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
        isRefreshing = false
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
        defaultIncrement: Int? = nil
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
        
        // Create initial stats for new challenge
        let initialStats = ChallengeStats(
            challengeId: tempId,
            totalCount: 0,
            remaining: target,
            daysElapsed: 0,
            daysRemaining: Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 365,
            perDayRequired: Double(target) / Double(max(1, Calendar.current.dateComponents([.day], from: startDate, to: endDate).day ?? 365)),
            currentPace: 0,
            paceStatus: .none,
            streakCurrent: 0,
            streakBest: 0,
            bestDay: nil,
            dailyAverage: 0
        )
        
        localStore.upsertChallenge(challenge)
        localStore.upsertStats(initialStats, for: tempId)
        localStore.addPendingChange(.create(id: tempId))
        challenges = localStore.loadChallenges()
        stats = localStore.loadStats()
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
        stats = localStore.loadStats()
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
    
    // MARK: - Entry Management (Optimistic)
    
    /// Add an entry optimistically - saves locally first, syncs in background
    /// Returns immediately after local save for instant UI feedback
    public func addEntry(_ request: CreateEntryRequest) {
        let tempId = UUID().uuidString
        let now = ISO8601DateFormatter().string(from: Date())
        
        // Create local entry immediately (optimistic)
        let entry = Entry(
            id: tempId,
            userId: "",  // Will be set by server
            challengeId: request.challengeId,
            date: request.date,
            count: request.count,
            sets: request.sets,
            note: request.note,
            feeling: request.feeling,
            createdAt: now,
            updatedAt: now
        )
        
        // Save locally and queue for sync
        localEntryStore.upsertEntry(entry)
        localEntryStore.addPendingChange(.create(id: tempId, request: request))
        
        // Update stats optimistically
        updateStatsOptimistically(for: request.challengeId, addedCount: request.count)
        
        updateSyncState()
        
        // Try to sync immediately in background if online
        if isOnline {
            Task {
                await syncPendingEntries()
            }
        }
    }
    
    /// Update stats locally after adding entry (optimistic update)
    private func updateStatsOptimistically(for challengeId: String, addedCount: Int) {
        guard var currentStats = stats[challengeId] else { return }
        
        // Update stats optimistically
        let newTotal = currentStats.totalCount + addedCount
        let challenge = challenges.first { $0.id == challengeId }
        let target = challenge?.target ?? currentStats.totalCount + currentStats.remaining
        let newRemaining = max(0, target - newTotal)
        
        // Calculate new pace
        let daysElapsed = max(1, currentStats.daysElapsed)
        let newPace = Double(newTotal) / Double(daysElapsed)
        
        // Determine pace status
        let newPaceStatus: PaceStatus
        if currentStats.perDayRequired > 0 {
            let ratio = newPace / currentStats.perDayRequired
            if ratio >= 1.1 {
                newPaceStatus = .ahead
            } else if ratio >= 0.9 {
                newPaceStatus = .onPace
            } else {
                newPaceStatus = .behind
            }
        } else {
            newPaceStatus = .none
        }
        
        let updatedStats = ChallengeStats(
            challengeId: challengeId,
            totalCount: newTotal,
            remaining: newRemaining,
            daysElapsed: currentStats.daysElapsed,
            daysRemaining: currentStats.daysRemaining,
            perDayRequired: currentStats.perDayRequired,
            currentPace: newPace,
            paceStatus: newPaceStatus,
            streakCurrent: currentStats.streakCurrent,
            streakBest: currentStats.streakBest,
            bestDay: currentStats.bestDay,
            dailyAverage: newPace
        )
        
        // Update in-memory and persisted stats
        stats[challengeId] = updatedStats
        localStore.upsertStats(updatedStats, for: challengeId)
    }
    
    /// Get recent entries for a challenge (from local cache)
    public func recentEntries(for challengeId: String, limit: Int = 10) -> [Entry] {
        localEntryStore.loadEntries(forChallenge: challengeId)
            .sorted { $0.date > $1.date }
            .prefix(limit)
            .map { $0 }
    }
    
    /// Fetch and cache entries for a challenge from server
    public func fetchEntries(for challengeId: String) async {
        do {
            let serverEntries = try await apiClient.listEntries(challengeId: challengeId)
            localEntryStore.mergeWithServer(serverEntries, forChallenge: challengeId)
        } catch {
            // Failed to fetch, local cache remains
        }
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
        stats = localStore.loadStats()
        updateSyncState()
    }
    
    /// Sync all pending entry changes to server
    private func syncPendingEntries() async {
        let pendingChanges = localEntryStore.loadPendingChanges()
        guard !pendingChanges.isEmpty else {
            updateSyncState()
            return
        }
        
        syncState = .syncing
        
        for change in pendingChanges {
            do {
                switch change {
                case .create(let tempId, let request):
                    // Create on server
                    let serverEntry = try await apiClient.createEntry(request)
                    
                    // Replace temp entry with server entry
                    localEntryStore.removeEntry(id: tempId)
                    localEntryStore.upsertEntry(serverEntry)
                    localEntryStore.removePendingChange(for: tempId)
                    
                case .update(let id):
                    // TODO: Implement update sync if needed
                    localEntryStore.removePendingChange(for: id)
                    
                case .delete(let id):
                    try await apiClient.deleteEntry(id: id)
                    localEntryStore.removePendingChange(for: id)
                }
                
            } catch let error as APIError {
                if !error.isRecoverable {
                    // Remove failed non-recoverable changes
                    localEntryStore.removePendingChange(for: change.entryId)
                }
                // Keep recoverable errors in queue for retry
            } catch {
                // Network errors - keep in queue for retry
            }
        }
        
        // After syncing entries, refresh to get updated stats from server
        // This ensures stats are accurate after server-side recalculation
        if isOnline {
            do {
                let serverData = try await apiClient.listChallenges(includeArchived: true)
                localStore.mergeWithServer(serverData)
                stats = localStore.loadStats()
            } catch {
                // Failed to refresh stats, keep optimistic values
            }
        }
        
        updateSyncState()
    }
    
    /// Update sync state based on pending changes
    private func updateSyncState() {
        let challengePendingCount = localStore.loadPendingChanges().count
        let entryPendingCount = localEntryStore.loadPendingChanges().count
        let totalPending = challengePendingCount + entryPendingCount
        
        if !isOnline {
            syncState = .offline
        } else if totalPending > 0 {
            syncState = .pending(count: totalPending)
        } else {
            syncState = .synced
        }
    }
    
    /// Clear all local data (for logout)
    public func clearLocalData() {
        localStore.clearAll()
        localEntryStore.clearAll()
        challenges = []
        stats = [:]
        syncState = .synced
    }
}
