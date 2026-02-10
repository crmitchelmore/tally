package com.tally.app.data

import android.content.Context
import android.content.SharedPreferences
import com.tally.core.network.ApiResult
import com.tally.core.network.Challenge
import com.tally.core.network.ChallengeStats
import com.tally.core.network.ChallengeWithStatsWrapper
import com.tally.core.network.CountType
import com.tally.core.network.CreateChallengeRequest
import com.tally.core.network.CreateEntryRequest
import com.tally.core.network.DashboardConfig
import com.tally.core.network.DashboardStats
import com.tally.core.network.Entry
import com.tally.core.network.ExportData
import com.tally.core.network.Feeling
import com.tally.core.network.PersonalRecords
import com.tally.core.network.PublicChallenge
import com.tally.core.network.TallyApiClient
import com.tally.core.network.TimeframeType
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.UUID

/**
 * Repository handling challenge and entry data with offline-first approach.
 * Syncs with API when online, falls back to local storage when offline.
 */
class ChallengesRepository(
    private val context: Context,
    private val apiClient: TallyApiClient?,
    private val isOfflineMode: Boolean
) {
    private val prefs: SharedPreferences = context.getSharedPreferences(
        "tally_challenges",
        Context.MODE_PRIVATE
    )

    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    private val _challenges = MutableStateFlow<List<Challenge>>(emptyList())
    val challenges: StateFlow<List<Challenge>> = _challenges.asStateFlow()

    private val _challengesWithStats = MutableStateFlow<List<ChallengeWithStatsWrapper>>(emptyList())
    val challengesWithStats: StateFlow<List<ChallengeWithStatsWrapper>> = _challengesWithStats.asStateFlow()

    private val _entries = MutableStateFlow<Map<String, List<Entry>>>(emptyMap())
    val entries: StateFlow<Map<String, List<Entry>>> = _entries.asStateFlow()

    private val _allEntries = MutableStateFlow<List<Entry>>(emptyList())
    val allEntries: StateFlow<List<Entry>> = _allEntries.asStateFlow()

    private val _dashboardStats = MutableStateFlow<DashboardStats?>(null)
    val dashboardStats: StateFlow<DashboardStats?> = _dashboardStats.asStateFlow()

    private val _personalRecords = MutableStateFlow<PersonalRecords?>(null)
    val personalRecords: StateFlow<PersonalRecords?> = _personalRecords.asStateFlow()

    private val _publicChallenges = MutableStateFlow<List<PublicChallenge>>(emptyList())
    val publicChallenges: StateFlow<List<PublicChallenge>> = _publicChallenges.asStateFlow()

    private val _followingChallenges = MutableStateFlow<List<PublicChallenge>>(emptyList())
    val followingChallenges: StateFlow<List<PublicChallenge>> = _followingChallenges.asStateFlow()

    private val _dashboardConfig = MutableStateFlow(DashboardConfig.DEFAULT)
    val dashboardConfig: StateFlow<DashboardConfig> = _dashboardConfig.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        loadLocalChallenges()
        loadLocalEntries()
        loadLocalDashboardConfig()
    }

    /**
     * Refresh challenges with stats from API (if online) or load from local storage.
     */
    suspend fun refresh() {
        _isLoading.value = true
        _error.value = null

        if (isOfflineMode || apiClient == null) {
            loadLocalChallenges()
            _isLoading.value = false
            return
        }

        // Fetch challenges with stats
        when (val result = apiClient.listChallengesWithStats()) {
            is ApiResult.Success -> {
                _challengesWithStats.value = result.data
                _challenges.value = result.data.map { it.challenge }
                saveChallengesLocally(result.data.map { it.challenge })
            }
            is ApiResult.Failure -> {
                _error.value = result.error.message
                loadLocalChallenges()
            }
        }

        // Fetch dashboard data
        when (val result = apiClient.getDashboardData()) {
            is ApiResult.Success -> {
                _dashboardStats.value = result.data.dashboard
                _personalRecords.value = result.data.records
                result.data.entries?.let { _allEntries.value = it }
            }
            is ApiResult.Failure -> {
                // Non-critical, don't set error
            }
        }

        _isLoading.value = false
    }

    /**
     * Refresh community challenges
     */
    suspend fun refreshCommunity(search: String? = null) {
        if (isOfflineMode || apiClient == null) return

        // Fetch discover challenges
        when (val result = apiClient.listPublicChallenges(search = search, following = false)) {
            is ApiResult.Success -> {
                _publicChallenges.value = result.data
            }
            is ApiResult.Failure -> {
                _error.value = result.error.message
            }
        }

        // Fetch following challenges
        when (val result = apiClient.listPublicChallenges(following = true)) {
            is ApiResult.Success -> {
                _followingChallenges.value = result.data
            }
            is ApiResult.Failure -> {
                // Non-critical
            }
        }
    }

    /**
     * Follow a public challenge
     */
    suspend fun followChallenge(challengeId: String): Boolean {
        if (isOfflineMode || apiClient == null) return false

        return when (val result = apiClient.followChallenge(challengeId)) {
            is ApiResult.Success -> {
                refreshCommunity()
                true
            }
            is ApiResult.Failure -> {
                _error.value = result.error.message
                false
            }
        }
    }

    /**
     * Unfollow a public challenge
     */
    suspend fun unfollowChallenge(challengeId: String): Boolean {
        if (isOfflineMode || apiClient == null) return false

        return when (val result = apiClient.unfollowChallenge(challengeId)) {
            is ApiResult.Success -> {
                refreshCommunity()
                true
            }
            is ApiResult.Failure -> {
                _error.value = result.error.message
                false
            }
        }
    }

    /**
     * Create a new challenge.
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
    ): Challenge? {
        _isLoading.value = true

        val challenge = if (isOfflineMode || apiClient == null) {
            createLocalChallenge(name, target, timeframeType, periodOffset, color, icon, countType, unitLabel, defaultIncrement)
        } else {
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
                is ApiResult.Success -> result.data
                is ApiResult.Failure -> {
                    _error.value = result.error.message
                    createLocalChallenge(name, target, timeframeType, periodOffset, color, icon, countType, unitLabel, defaultIncrement)
                }
            }
        }

        if (challenge != null) {
            val updated = _challenges.value + challenge
            _challenges.value = updated
            saveChallengesLocally(updated)
        }

        _isLoading.value = false
        return challenge
    }

    /**
     * Add an entry to a challenge.
     */
    suspend fun addEntry(
        challengeId: String,
        count: Int,
        date: LocalDate = LocalDate.now(),
        sets: List<Int>? = null,
        note: String? = null,
        feeling: Feeling? = null
    ): Entry? {
        _isLoading.value = true

        val dateStr = date.format(DateTimeFormatter.ISO_LOCAL_DATE)
        
        val entry = if (isOfflineMode || apiClient == null) {
            createLocalEntry(challengeId, count, dateStr, sets, note, feeling)
        } else {
            val request = CreateEntryRequest(
                challengeId = challengeId,
                date = dateStr,
                count = count,
                sets = sets,
                note = note,
                feeling = feeling
            )
            when (val result = apiClient.createEntry(request)) {
                is ApiResult.Success -> result.data
                is ApiResult.Failure -> {
                    _error.value = result.error.message
                    createLocalEntry(challengeId, count, dateStr, sets, note, feeling)
                }
            }
        }

        if (entry != null) {
            val currentEntries = _entries.value.toMutableMap()
            val challengeEntries = currentEntries[challengeId]?.toMutableList() ?: mutableListOf()
            challengeEntries.add(entry)
            currentEntries[challengeId] = challengeEntries
            _entries.value = currentEntries
            saveEntriesLocally(currentEntries)

            // Refresh to get updated stats
            refresh()
        }

        _isLoading.value = false
        return entry
    }

    /**
     * Delete a challenge.
     */
    suspend fun deleteChallenge(challengeId: String): Boolean {
        _isLoading.value = true

        val success = if (isOfflineMode || apiClient == null) {
            true
        } else {
            when (val result = apiClient.deleteChallenge(challengeId)) {
                is ApiResult.Success -> true
                is ApiResult.Failure -> {
                    _error.value = result.error.message
                    true
                }
            }
        }

        if (success) {
            val updated = _challenges.value.filter { it.id != challengeId }
            _challenges.value = updated
            saveChallengesLocally(updated)

            val currentEntries = _entries.value.toMutableMap()
            currentEntries.remove(challengeId)
            _entries.value = currentEntries
            saveEntriesLocally(currentEntries)
        }

        _isLoading.value = false
        return success
    }

    /**
     * Update an existing entry.
     */
    suspend fun updateEntry(
        entryId: String,
        challengeId: String,
        count: Int? = null,
        date: String? = null,
        sets: List<Int>? = null,
        note: String? = null,
        feeling: Feeling? = null
    ): Entry? {
        if (isOfflineMode || apiClient == null) {
            // Update locally
            val currentEntries = _entries.value.toMutableMap()
            val challengeEntries = currentEntries[challengeId]?.toMutableList() ?: return null
            val idx = challengeEntries.indexOfFirst { it.id == entryId }
            if (idx < 0) return null
            val old = challengeEntries[idx]
            val updated = old.copy(
                count = count ?: old.count,
                date = date ?: old.date,
                sets = sets ?: old.sets,
                note = note ?: old.note,
                feeling = feeling ?: old.feeling
            )
            challengeEntries[idx] = updated
            currentEntries[challengeId] = challengeEntries
            _entries.value = currentEntries
            saveEntriesLocally(currentEntries)
            return updated
        }

        val request = com.tally.core.network.UpdateEntryRequest(
            count = count, date = date, sets = sets, note = note, feeling = feeling
        )
        return when (val result = apiClient.updateEntry(entryId, request)) {
            is ApiResult.Success -> {
                val entry = result.data
                val currentEntries = _entries.value.toMutableMap()
                val challengeEntries = currentEntries[challengeId]?.toMutableList() ?: mutableListOf()
                val idx = challengeEntries.indexOfFirst { it.id == entryId }
                if (idx >= 0) challengeEntries[idx] = entry else challengeEntries.add(entry)
                currentEntries[challengeId] = challengeEntries
                _entries.value = currentEntries
                saveEntriesLocally(currentEntries)
                refresh()
                entry
            }
            is ApiResult.Failure -> {
                _error.value = result.error.message
                null
            }
        }
    }

    /**
     * Delete an entry.
     */
    suspend fun deleteEntry(entryId: String, challengeId: String): Boolean {
        val success = if (isOfflineMode || apiClient == null) {
            true
        } else {
            when (val result = apiClient.deleteEntry(entryId)) {
                is ApiResult.Success -> true
                is ApiResult.Failure -> {
                    _error.value = result.error.message
                    false
                }
            }
        }

        if (success) {
            val currentEntries = _entries.value.toMutableMap()
            val challengeEntries = currentEntries[challengeId]?.filter { it.id != entryId } ?: emptyList()
            currentEntries[challengeId] = challengeEntries
            _entries.value = currentEntries
            saveEntriesLocally(currentEntries)
            refresh()
        }
        return success
    }

    /**
     * Update a challenge (e.g. archive/unarchive, edit name/target).
     */
    suspend fun updateChallenge(
        challengeId: String,
        name: String? = null,
        target: Int? = null,
        isArchived: Boolean? = null,
        isPublic: Boolean? = null,
        color: String? = null,
        icon: String? = null
    ): Challenge? {
        if (isOfflineMode || apiClient == null) {
            val idx = _challenges.value.indexOfFirst { it.id == challengeId }
            if (idx < 0) return null
            val old = _challenges.value[idx]
            val updated = old.copy(
                name = name ?: old.name,
                target = target ?: old.target,
                isArchived = isArchived ?: old.isArchived,
                isPublic = isPublic ?: old.isPublic,
                color = color ?: old.color,
                icon = icon ?: old.icon
            )
            val list = _challenges.value.toMutableList()
            list[idx] = updated
            _challenges.value = list
            saveChallengesLocally(list)
            return updated
        }

        val request = com.tally.core.network.UpdateChallengeRequest(
            name = name, target = target, isArchived = isArchived,
            isPublic = isPublic, color = color, icon = icon
        )
        return when (val result = apiClient.updateChallenge(challengeId, request)) {
            is ApiResult.Success -> {
                refresh()
                result.data
            }
            is ApiResult.Failure -> {
                _error.value = result.error.message
                null
            }
        }
    }

    /**
     * Restore a deleted challenge.
     */
    suspend fun restoreChallenge(challengeId: String): Boolean {
        if (isOfflineMode || apiClient == null) return false
        return when (val result = apiClient.restoreChallenge(challengeId)) {
            is ApiResult.Success -> {
                refresh()
                true
            }
            is ApiResult.Failure -> {
                _error.value = result.error.message
                false
            }
        }
    }

    /**
     * Restore a deleted entry.
     */
    suspend fun restoreEntry(entryId: String): Boolean {
        if (isOfflineMode || apiClient == null) return false
        return when (val result = apiClient.restoreEntry(entryId)) {
            is ApiResult.Success -> {
                refresh()
                true
            }
            is ApiResult.Failure -> {
                _error.value = result.error.message
                false
            }
        }
    }

    /**
     * Get entries for a specific challenge.
     */
    fun entriesForChallenge(challengeId: String): List<Entry> {
        return _entries.value[challengeId] ?: emptyList()
    }

    /**
     * Get total count for a challenge from entries.
     */
    fun getTotalCount(challengeId: String): Int {
        return _entries.value[challengeId]?.sumOf { it.count } ?: 0
    }

    /**
     * Get stats for a challenge
     */
    fun getStatsForChallenge(challengeId: String): ChallengeStats? {
        return _challengesWithStats.value.find { it.challenge.id == challengeId }?.stats
    }

    /**
     * Export all user data
     */
    suspend fun exportData(): ExportData? {
        if (isOfflineMode || apiClient == null) return null

        return when (val result = apiClient.exportData()) {
            is ApiResult.Success -> result.data
            is ApiResult.Failure -> {
                _error.value = result.error.message
                null
            }
        }
    }

    /**
     * Import user data
     */
    suspend fun importData(data: ExportData): Boolean {
        if (isOfflineMode || apiClient == null) return false

        return when (val result = apiClient.importData(data)) {
            is ApiResult.Success -> {
                refresh()
                true
            }
            is ApiResult.Failure -> {
                _error.value = result.error.message
                false
            }
        }
    }

    /**
     * Delete all user data
     */
    suspend fun deleteAllData(): Boolean {
        if (isOfflineMode || apiClient == null) {
            // Clear local data
            _challenges.value = emptyList()
            _entries.value = emptyMap()
            prefs.edit().clear().apply()
            return true
        }

        return when (val result = apiClient.deleteAllData()) {
            is ApiResult.Success -> {
                _challenges.value = emptyList()
                _entries.value = emptyMap()
                prefs.edit().clear().apply()
                true
            }
            is ApiResult.Failure -> {
                _error.value = result.error.message
                false
            }
        }
    }

    /**
     * Update dashboard configuration
     */
    fun updateDashboardConfig(config: DashboardConfig) {
        _dashboardConfig.value = config
        saveDashboardConfigLocally(config)
    }

    /**
     * Clear error state.
     */
    fun clearError() {
        _error.value = null
    }

    // === Local Storage ===

    private fun loadLocalChallenges() {
        val data = prefs.getString(KEY_CHALLENGES, null) ?: return
        try {
            _challenges.value = json.decodeFromString(data)
        } catch (e: Exception) {
            // Ignore parse errors, start fresh
        }
    }

    private fun saveChallengesLocally(challenges: List<Challenge>) {
        prefs.edit().putString(KEY_CHALLENGES, json.encodeToString(challenges)).apply()
    }

    private fun loadLocalEntries() {
        val data = prefs.getString(KEY_ENTRIES, null) ?: return
        try {
            _entries.value = json.decodeFromString(data)
        } catch (e: Exception) {
            // Ignore parse errors
        }
    }

    private fun saveEntriesLocally(entries: Map<String, List<Entry>>) {
        prefs.edit().putString(KEY_ENTRIES, json.encodeToString(entries)).apply()
    }

    private fun loadLocalDashboardConfig() {
        val data = prefs.getString(KEY_DASHBOARD_CONFIG, null) ?: return
        try {
            _dashboardConfig.value = json.decodeFromString(data)
        } catch (e: Exception) {
            // Use default
        }
    }

    private fun saveDashboardConfigLocally(config: DashboardConfig) {
        prefs.edit().putString(KEY_DASHBOARD_CONFIG, json.encodeToString(config)).apply()
    }

    private fun createLocalChallenge(
        name: String,
        target: Int,
        timeframeType: TimeframeType,
        periodOffset: Int,
        color: String,
        icon: String,
        countType: CountType,
        unitLabel: String?,
        defaultIncrement: Int?
    ): Challenge {
        val now = java.time.Instant.now().toString()
        val (startDate, endDate) = calculateDateRange(timeframeType, periodOffset)
        
        return Challenge(
            id = UUID.randomUUID().toString(),
            userId = "local",
            name = name,
            target = target,
            timeframeType = timeframeType,
            startDate = startDate,
            endDate = endDate,
            color = color,
            icon = icon,
            isPublic = false,
            isArchived = false,
            countType = countType,
            unitLabel = unitLabel,
            defaultIncrement = defaultIncrement,
            createdAt = now,
            updatedAt = now
        )
    }

    private fun createLocalEntry(
        challengeId: String,
        count: Int,
        date: String,
        sets: List<Int>?,
        note: String?,
        feeling: Feeling?
    ): Entry {
        val now = java.time.Instant.now().toString()
        return Entry(
            id = UUID.randomUUID().toString(),
            userId = "local",
            challengeId = challengeId,
            date = date,
            count = count,
            sets = sets,
            note = note,
            feeling = feeling,
            createdAt = now,
            updatedAt = now
        )
    }

    private fun calculateDateRange(timeframeType: TimeframeType, periodOffset: Int = 0): Pair<String, String> {
        val now = LocalDate.now()
        val formatter = DateTimeFormatter.ISO_LOCAL_DATE
        
        return when (timeframeType) {
            TimeframeType.YEAR -> {
                val targetYear = now.plusYears(periodOffset.toLong())
                val start = targetYear.withDayOfYear(1)
                val end = targetYear.withDayOfYear(targetYear.lengthOfYear())
                start.format(formatter) to end.format(formatter)
            }
            TimeframeType.MONTH -> {
                val targetMonth = now.plusMonths(periodOffset.toLong())
                val start = targetMonth.withDayOfMonth(1)
                val end = targetMonth.withDayOfMonth(targetMonth.lengthOfMonth())
                start.format(formatter) to end.format(formatter)
            }
            TimeframeType.CUSTOM -> {
                val start = now
                val end = now.plusMonths(1)
                start.format(formatter) to end.format(formatter)
            }
        }
    }

    companion object {
        private const val KEY_CHALLENGES = "challenges"
        private const val KEY_ENTRIES = "entries"
        private const val KEY_DASHBOARD_CONFIG = "dashboard_config"
    }
}
