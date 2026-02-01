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
    
    /// Dashboard panel configuration (cached locally, synced to API)
    public private(set) var dashboardConfig: DashboardConfig = .default
    
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
    
    /// Bumps whenever entries change to refresh dependent views
    public private(set) var entriesVersion: Int = 0
    
    /// Server-provided dashboard stats (preferred over local aggregates)
    public private(set) var serverDashboardStats: DashboardStats?
    
    /// Server-provided personal records (preferred over local aggregates)
    public private(set) var serverPersonalRecords: PersonalRecords?
    
    /// Dashboard stats computed from all challenges
    public var dashboardStats: DashboardStats? {
        serverDashboardStats
    }
    
    /// Personal records computed from all challenges
    public var personalRecords: PersonalRecords? {
        serverPersonalRecords
    }
    
    /// All entries across all challenges
    public var allEntries: [Entry] {
        _ = entriesVersion
        return localEntryStore.loadEntries()
    }

    /// Entries for a specific challenge (sorted newest first)
    public func entries(for challengeId: String) -> [Entry] {
        _ = entriesVersion
        return localEntryStore.loadEntries(forChallenge: challengeId)
            .sorted { $0.date > $1.date }
    }
    
    // MARK: - Dependencies
    
    private let apiClient: APIClient
    private let localStore: LocalChallengeStore
    private let localEntryStore: LocalEntryStore
    private let dashboardConfigDefaults: UserDefaults
    private let dashboardConfigKey = "tally.dashboard.config"
    
    private static let fullDateFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter
    }()
    
    private static let timestampFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()
    
    // MARK: - Initialization
    
    public init(
        apiClient: APIClient = .shared,
        localStore: LocalChallengeStore = .shared,
        localEntryStore: LocalEntryStore = .shared,
        dashboardConfigDefaults: UserDefaults = .standard
    ) {
        self.apiClient = apiClient
        self.localStore = localStore
        self.localEntryStore = localEntryStore
        self.dashboardConfigDefaults = dashboardConfigDefaults
        
        // Load cached data immediately - this is synchronous
        self.challenges = localStore.loadChallenges()
        self.stats = localStore.loadStats()
        self.dashboardConfig = loadDashboardConfig()
        updateSyncState()
        Task {
            await refreshDashboardConfig()
        }
        Task {
            await refreshDashboardSummary()
        }
    }
    
    // MARK: - Public API
    
    /// Get stats for a specific challenge
    public func stats(for challengeId: String) -> ChallengeStats? {
        stats[challengeId]
    }
    
    /// Refresh challenges from server (called on app launch, pull-to-refresh)
    public func refresh() async {
        print("[ChallengesManager] refresh() called, current challenges: \(challenges.count)")
        // Only show loading spinner if we have no cached data
        // Otherwise just refresh silently in background
        if challenges.isEmpty {
            isLoading = true
        } else {
            isRefreshing = true
        }
        errorMessage = nil
        
        do {
            async let serverChallenges = apiClient.listChallenges(includeArchived: true)
            async let serverSummary = apiClient.getDashboardSummary()
            let serverData = try await serverChallenges
            localStore.mergeWithServer(serverData)
            challenges = localStore.loadChallenges()
            stats = localStore.loadStats()
            let summary = try await serverSummary
            serverDashboardStats = summary.dashboard
            serverPersonalRecords = summary.records
            isOnline = true
            print("[ChallengesManager] refresh() success, challenges: \(challenges.count)")
            Task {
                await refreshEntriesForDashboard()
                await refreshDashboardConfig()
            }
            
            // Try to sync any pending changes
            await syncPendingChanges()
        } catch let error as APIError {
            print("[ChallengesManager] refresh() APIError: \(error.localizedDescription)")
            if error.isRecoverable || error.requiresReauth {
                isOnline = false
                syncState = .offline
            } else {
                errorMessage = error.errorDescription
            }
            // Reload from local storage on error
            challenges = localStore.loadChallenges()
            stats = localStore.loadStats()
            serverDashboardStats = nil
            serverPersonalRecords = nil
            print("[ChallengesManager] refresh() loaded from local: \(challenges.count) challenges")
            Task {
                await refreshDashboardSummary()
                await refreshDashboardConfig()
            }
        } catch {
            print("[ChallengesManager] refresh() error: \(error.localizedDescription)")
            isOnline = false
            syncState = .offline
            // Reload from local storage on error
            challenges = localStore.loadChallenges()
            stats = localStore.loadStats()
            serverDashboardStats = nil
            serverPersonalRecords = nil
            print("[ChallengesManager] refresh() loaded from local: \(challenges.count) challenges")
            Task {
                await refreshDashboardSummary()
                await refreshDashboardConfig()
            }
        }
        
        isLoading = false
        isRefreshing = false
        updateSyncState()
    }

    /// Refresh dashboard stats + personal records summary
    public func refreshDashboardSummary() async {
        do {
            let summary = try await apiClient.getDashboardSummary()
            serverDashboardStats = summary.dashboard
            serverPersonalRecords = summary.records
        } catch {
            serverDashboardStats = nil
            serverPersonalRecords = nil
        }
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
        print("[ChallengesManager] Created challenge '\(name)' with id \(tempId), total challenges: \(challenges.count)")
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
            countType: challenge.countType,
            unitLabel: challenge.unitLabel,
            defaultIncrement: challenge.defaultIncrement,
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
        markEntriesUpdated()
        
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
            markEntriesUpdated()
        } catch {
            // Failed to fetch, local cache remains
        }
    }

    /// Update a cached entry and queue for sync
    public func updateEntry(_ entry: Entry, request: UpdateEntryRequest) {
        if let sets = request.sets, !sets.isEmpty {
            let sum = sets.reduce(0, +)
            if request.count != nil && request.count != sum {
                print("[ChallengesManager] updateEntry count mismatch for sets; updating to \(sum)")
            }
        }
        let effectiveCount = request.sets.map { $0.reduce(0, +) } ?? request.count ?? entry.count
        let updated = Entry(
            id: entry.id,
            userId: entry.userId,
            challengeId: entry.challengeId,
            date: request.date ?? entry.date,
            count: effectiveCount,
            sets: request.sets ?? entry.sets,
            note: request.note ?? entry.note,
            feeling: request.feeling ?? entry.feeling,
            createdAt: entry.createdAt,
            updatedAt: Self.timestampFormatter.string(from: Date())
        )
        
        let syncRequest = UpdateEntryRequest(
            date: request.date,
            count: effectiveCount,
            sets: request.sets,
            note: request.note,
            feeling: request.feeling
        )
        localEntryStore.upsertEntry(updated)
        localEntryStore.addPendingChange(.update(id: entry.id, request: syncRequest))
        updateStatsForEntryUpdate(entry, updated)
        markEntriesUpdated()
        updateSyncState()
        
        if isOnline {
            Task {
                await syncPendingEntries()
            }
        }
    }
    
    /// Delete a cached entry and queue for sync
    public func deleteEntry(_ entry: Entry) {
        localEntryStore.removeEntry(id: entry.id)
        localEntryStore.addPendingChange(.delete(id: entry.id))
        updateStatsForEntryDelete(entry)
        markEntriesUpdated()
        updateSyncState()
        
        if isOnline {
            Task {
                await syncPendingEntries()
            }
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
                            isArchived: local.isArchived,
                            countType: local.countType,
                            unitLabel: local.unitLabel,
                            defaultIncrement: local.defaultIncrement
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
                    
                case .update(let id, let request):
                    let serverEntry = try await apiClient.updateEntry(id: id, data: request)
                    localEntryStore.upsertEntry(serverEntry)
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
        
        markEntriesUpdated()
        updateSyncState()
    }

    /// Load cached dashboard config (local-first)
    private func loadDashboardConfig() -> DashboardConfig {
        guard let data = dashboardConfigDefaults.data(forKey: dashboardConfigKey),
              let config = try? JSONDecoder().decode(DashboardConfig.self, from: data) else {
            return .default
        }
        return config
    }
    
    /// Persist dashboard config to local cache
    private func saveDashboardConfig(_ config: DashboardConfig) {
        guard let data = try? JSONEncoder().encode(config) else { return }
        dashboardConfigDefaults.set(data, forKey: dashboardConfigKey)
    }
    
    /// Update config locally and sync to API in background
    public func updateDashboardConfig(_ config: DashboardConfig) {
        dashboardConfig = config
        saveDashboardConfig(config)
        Task {
            await syncDashboardConfig(config)
        }
    }
    
    /// Fetch config from API and merge with local defaults
    public func refreshDashboardConfig() async {
        do {
            let server = try await apiClient.getUserPreferences()
            dashboardConfig = server.dashboardConfig
            saveDashboardConfig(server.dashboardConfig)
        } catch {
            // Local cache remains
        }
    }
    
    /// Sync updated config to API (best-effort)
    private func syncDashboardConfig(_ config: DashboardConfig) async {
        do {
            _ = try await apiClient.updateUserPreferences(dashboardConfig: config)
        } catch {
            // Best-effort; local cache is source of truth until next sync
        }
    }
    
    private func updateStatsForEntryUpdate(_ oldEntry: Entry, _ newEntry: Entry) {
        guard oldEntry.challengeId == newEntry.challengeId else {
            updateStatsForEntryDelete(oldEntry)
            updateStatsOptimistically(for: newEntry.challengeId, addedCount: newEntry.count)
            return
        }
        let delta = newEntry.count - oldEntry.count
        guard delta != 0 else { return }
        updateStatsOptimistically(for: newEntry.challengeId, addedCount: delta)
    }
    
    private func updateStatsForEntryDelete(_ entry: Entry) {
        updateStatsOptimistically(for: entry.challengeId, addedCount: -entry.count)
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
        markEntriesUpdated()
        syncState = .synced
    }

    private func markEntriesUpdated() {
        entriesVersion += 1
    }

    private func refreshEntriesForDashboard() async {
        let challengeIds = activeChallenges.map { $0.id }
        await withTaskGroup(of: Void.self) { group in
            for id in challengeIds {
                group.addTask {
                    await self.fetchEntries(for: id)
                }
            }
        }
    }
}
