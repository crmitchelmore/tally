package com.tally.core.data

import android.content.Context
import com.tally.core.network.ApiResult
import com.tally.core.network.Challenge
import com.tally.core.network.ChallengeStats
import com.tally.core.network.CountType
import com.tally.core.network.CreateChallengeRequest
import com.tally.core.network.CreateEntryRequest
import com.tally.core.network.Entry
import com.tally.core.network.Feeling
import com.tally.core.network.PaceStatus
import com.tally.core.network.TallyApiClient
import com.tally.core.network.TimeframeType
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * Unified manager for challenges and entries with offline-first pattern.
 * Loads from cache instantly, refreshes in background.
 * Mirrors iOS ChallengesManager.
 */
class ChallengesManager(
    private val apiClient: TallyApiClient,
    private val challengeStore: LocalChallengeStore,
    private val entryStore: LocalEntryStore
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    
    // Challenges state
    private val _challenges = MutableStateFlow<List<Challenge>>(emptyList())
    val challenges: StateFlow<List<Challenge>> = _challenges.asStateFlow()
    
    // Stats state (indexed by challenge ID)
    private val _stats = MutableStateFlow<Map<String, ChallengeStats>>(emptyMap())
    val stats: StateFlow<Map<String, ChallengeStats>> = _stats.asStateFlow()
    
    // Loading states
    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()
    
    // Sync state
    private val _syncState = MutableStateFlow(SyncState.SYNCED)
    val syncState: StateFlow<SyncState> = _syncState.asStateFlow()
    
    init {
        // Load from cache immediately
        loadFromCache()
    }
    
    /** Load cached data - instant startup */
    private fun loadFromCache() {
        val cachedChallenges = challengeStore.loadChallenges()
        val cachedStats = challengeStore.loadStats()
        
        if (cachedChallenges.isNotEmpty()) {
            _challenges.value = cachedChallenges
            _stats.value = cachedStats
            _isLoading.value = false
        }
        
        updateSyncState()
    }
    
    /** Refresh challenges from server (call on app launch or pull-to-refresh) */
    suspend fun refreshChallenges() {
        // If no cache, show loading spinner
        if (_challenges.value.isEmpty()) {
            _isLoading.value = true
        } else {
            // Have cache - show refreshing indicator but keep showing data
            _isRefreshing.value = true
        }
        
        when (val result = apiClient.listChallenges()) {
            is ApiResult.Success -> {
                val challengesWithStats = result.data
                val challenges = challengesWithStats.map { it.challenge }
                val statsMap = challengesWithStats.associate { it.challenge.id to it.stats }
                
                // Update cache
                challengeStore.saveChallenges(challenges)
                challengeStore.saveStats(statsMap)
                
                // Update state
                _challenges.value = challenges
                _stats.value = statsMap
            }
            is ApiResult.Failure -> {
                // Keep using cached data
            }
        }
        
        _isLoading.value = false
        _isRefreshing.value = false
        
        // Also sync any pending entries
        syncPendingEntries()
    }
    
    // MARK: - Entry Operations (Optimistic)
    
    /**
     * Add entry optimistically - saves locally immediately, syncs in background.
     * Returns instantly for snappy UI feedback.
     */
    fun addEntry(
        challengeId: String,
        date: String = LocalDate.now().toString(),
        count: Int,
        sets: List<Int>? = null,
        note: String? = null,
        feeling: Feeling? = null
    ) {
        val tempId = UUID.randomUUID().toString()
        val now = Instant.now().toString()
        
        // Create local entry immediately (optimistic)
        val entry = Entry(
            id = tempId,
            userId = "",  // Will be set by server
            challengeId = challengeId,
            date = date,
            count = count,
            sets = sets,
            note = note,
            feeling = feeling,
            createdAt = now,
            updatedAt = now
        )
        
        // Create the API request
        val request = CreateEntryRequest(
            challengeId = challengeId,
            date = date,
            count = count,
            note = note,
            feeling = feeling
        )
        
        // Save locally and queue for sync
        entryStore.upsertEntry(entry)
        entryStore.addPendingChange(
            EntryPendingChange.Create(
                entryId = tempId,
                request = SerializableCreateEntryRequest.from(request, sets)
            )
        )
        
        // Optimistically update stats
        updateStatsOptimistically(challengeId, count)
        
        updateSyncState()
        
        // Try to sync immediately in background
        scope.launch {
            syncPendingEntries()
        }
    }
    
    /** Update stats locally after adding entry */
    private fun updateStatsOptimistically(challengeId: String, addedCount: Int) {
        val currentStats = _stats.value.toMutableMap()
        currentStats[challengeId]?.let { stats ->
            // Update total count optimistically
            val newStats = stats.copy(
                totalCount = stats.totalCount + addedCount,
                remaining = maxOf(0, stats.remaining - addedCount)
            )
            currentStats[challengeId] = newStats
            _stats.value = currentStats
            
            // Also update cache
            challengeStore.saveStats(currentStats)
        }
    }
    
    // MARK: - Challenge Operations
    
    /**
     * Create a challenge - saves locally immediately, syncs in background for online mode.
     * Returns the created challenge.
     */
    suspend fun createChallenge(
        name: String,
        target: Int,
        timeframeType: TimeframeType,
        periodOffset: Int = 0,
        color: String = "#4F46E5",
        icon: String = "star",
        isPublic: Boolean = false,
        countType: CountType = CountType.SIMPLE,
        unitLabel: String? = null,
        defaultIncrement: Int? = null
    ): Challenge {
        val now = Instant.now().toString()
        val (startDate, endDate) = calculateDateRange(timeframeType, periodOffset)
        
        // Create local challenge
        val challenge = Challenge(
            id = UUID.randomUUID().toString(),
            userId = "", // Set by server or remains empty for local
            name = name,
            target = target,
            timeframeType = timeframeType,
            startDate = startDate,
            endDate = endDate,
            color = color,
            icon = icon,
            isPublic = isPublic,
            isArchived = false,
            countType = countType,
            unitLabel = unitLabel,
            defaultIncrement = defaultIncrement,
            createdAt = now,
            updatedAt = now
        )
        
        // Save locally immediately
        val updated = _challenges.value + challenge
        _challenges.value = updated
        challengeStore.saveChallenges(updated)
        
        // Initialize empty stats for the new challenge
        val newStats = ChallengeStats(
            challengeId = challenge.id,
            totalCount = 0,
            remaining = target,
            daysElapsed = 0,
            daysRemaining = 365, // Will be calculated properly on refresh
            perDayRequired = target.toDouble() / 365,
            currentPace = 0.0,
            paceStatus = PaceStatus.ON_PACE,
            streakCurrent = 0,
            streakBest = 0,
            bestDay = null,
            dailyAverage = 0.0
        )
        val statsMap = _stats.value.toMutableMap()
        statsMap[challenge.id] = newStats
        _stats.value = statsMap
        challengeStore.saveStats(statsMap)
        
        // Try to sync to server in background (if online)
        scope.launch {
            val request = CreateChallengeRequest(
                name = name,
                target = target,
                timeframeType = timeframeType,
                periodOffset = periodOffset,
                color = color,
                icon = icon,
                isPublic = isPublic,
                countType = countType,
                unitLabel = unitLabel,
                defaultIncrement = defaultIncrement
            )
            when (val result = apiClient.createChallenge(request)) {
                is ApiResult.Success -> {
                    // Replace local challenge with server version
                    val serverChallenge = result.data
                    val newList = _challenges.value.map { 
                        if (it.id == challenge.id) serverChallenge else it 
                    }
                    _challenges.value = newList
                    challengeStore.saveChallenges(newList)
                }
                is ApiResult.Failure -> {
                    // Keep local challenge - will sync later or user will see local only
                }
            }
        }
        
        return challenge
    }
    
    private fun calculateDateRange(timeframeType: TimeframeType, periodOffset: Int): Pair<String, String> {
        val now = LocalDate.now()
        return when (timeframeType) {
            TimeframeType.YEAR -> {
                val targetYear = now.plusYears(periodOffset.toLong())
                val start = targetYear.withDayOfYear(1)
                val end = targetYear.withDayOfYear(targetYear.lengthOfYear())
                start.toString() to end.toString()
            }
            TimeframeType.MONTH -> {
                val targetMonth = now.plusMonths(periodOffset.toLong())
                val start = targetMonth.withDayOfMonth(1)
                val end = targetMonth.withDayOfMonth(targetMonth.lengthOfMonth())
                start.toString() to end.toString()
            }
            TimeframeType.CUSTOM -> {
                val start = now
                val end = now.plusMonths(1)
                start.toString() to end.toString()
            }
        }
    }
    
    /**
     * Get recent entries for a challenge (from local cache).
     */
    fun recentEntries(challengeId: String, limit: Int = 10): List<Entry> {
        return entryStore.loadEntries(challengeId)
            .sortedByDescending { it.date }
            .take(limit)
    }
    
    /**
     * Fetch entries for a challenge from server and cache.
     */
    suspend fun fetchEntries(challengeId: String) {
        when (val result = apiClient.listEntries(challengeId = challengeId)) {
            is ApiResult.Success -> {
                entryStore.mergeWithServer(result.data, challengeId)
            }
            is ApiResult.Failure -> {
                // Keep using cached entries
            }
        }
    }
    
    /**
     * Sync all pending entry changes to server.
     */
    suspend fun syncPendingEntries() {
        val pendingChanges = entryStore.loadPendingChanges()
        if (pendingChanges.isEmpty()) {
            updateSyncState()
            return
        }
        
        _syncState.value = SyncState.SYNCING
        
        for (change in pendingChanges) {
            when (change) {
                is EntryPendingChange.Create -> {
                    val result = apiClient.createEntry(change.request.toApiRequest())
                    when (result) {
                        is ApiResult.Success -> {
                            // Replace temp entry with server entry
                            entryStore.removeEntry(change.entryId)
                            entryStore.upsertEntry(result.data)
                            entryStore.removePendingChange(change.entryId)
                        }
                        is ApiResult.Failure -> {
                            if (!result.error.isRecoverable) {
                                entryStore.removePendingChange(change.entryId)
                            }
                        }
                    }
                }
                is EntryPendingChange.Update -> {
                    entryStore.removePendingChange(change.entryId)
                }
                is EntryPendingChange.Delete -> {
                    val result = apiClient.deleteEntry(change.entryId)
                    when (result) {
                        is ApiResult.Success -> {
                            entryStore.removePendingChange(change.entryId)
                        }
                        is ApiResult.Failure -> {
                            if (!result.error.isRecoverable) {
                                entryStore.removePendingChange(change.entryId)
                            }
                        }
                    }
                }
            }
        }
        
        updateSyncState()
    }
    
    /** Clear all local data (for logout) */
    fun clearLocalData() {
        challengeStore.clearAll()
        entryStore.clearAll()
        _challenges.value = emptyList()
        _stats.value = emptyMap()
        updateSyncState()
    }
    
    private fun updateSyncState() {
        val pendingCount = entryStore.loadPendingChanges().size
        _syncState.value = when {
            pendingCount > 0 -> SyncState.PENDING
            else -> SyncState.SYNCED
        }
    }
    
    companion object {
        @Volatile
        private var instance: ChallengesManager? = null
        
        /** Get or create singleton instance */
        fun getInstance(
            context: Context,
            apiClient: TallyApiClient
        ): ChallengesManager {
            return instance ?: synchronized(this) {
                instance ?: ChallengesManager(
                    apiClient = apiClient,
                    challengeStore = LocalChallengeStore(context),
                    entryStore = LocalEntryStore(context)
                ).also { instance = it }
            }
        }
        
        /** Reset instance (for testing or logout) */
        fun resetInstance() {
            instance = null
        }
    }
}
