package com.tally.app.data

import android.content.Context
import android.content.SharedPreferences
import com.tally.core.network.ApiResult
import com.tally.core.network.Challenge
import com.tally.core.network.CreateChallengeRequest
import com.tally.core.network.CreateEntryRequest
import com.tally.core.network.Entry
import com.tally.core.network.Feeling
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

    private val _entries = MutableStateFlow<Map<String, List<Entry>>>(emptyMap())
    val entries: StateFlow<Map<String, List<Entry>>> = _entries.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    init {
        loadLocalChallenges()
        loadLocalEntries()
    }

    /**
     * Refresh challenges from API (if online) or load from local storage.
     */
    suspend fun refresh() {
        _isLoading.value = true
        _error.value = null

        if (isOfflineMode || apiClient == null) {
            // Just use local data
            loadLocalChallenges()
            _isLoading.value = false
            return
        }

        when (val result = apiClient.listChallenges()) {
            is ApiResult.Success -> {
                _challenges.value = result.data
                saveChallengesLocally(result.data)
            }
            is ApiResult.Failure -> {
                _error.value = result.error.message
                // Fall back to local data
                loadLocalChallenges()
            }
        }

        _isLoading.value = false
    }

    /**
     * Create a new challenge.
     */
    suspend fun createChallenge(
        name: String,
        target: Int,
        timeframeType: TimeframeType,
        color: String = "#4F46E5",
        icon: String = "star"
    ): Challenge? {
        _isLoading.value = true

        val challenge = if (isOfflineMode || apiClient == null) {
            // Create locally
            createLocalChallenge(name, target, timeframeType, color, icon)
        } else {
            val request = CreateChallengeRequest(
                name = name,
                target = target,
                timeframeType = timeframeType,
                color = color,
                icon = icon
            )
            when (val result = apiClient.createChallenge(request)) {
                is ApiResult.Success -> result.data
                is ApiResult.Failure -> {
                    _error.value = result.error.message
                    // Fall back to local creation
                    createLocalChallenge(name, target, timeframeType, color, icon)
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
        note: String? = null,
        feeling: Feeling? = null
    ): Entry? {
        _isLoading.value = true

        val dateStr = date.format(DateTimeFormatter.ISO_LOCAL_DATE)
        
        val entry = if (isOfflineMode || apiClient == null) {
            createLocalEntry(challengeId, count, dateStr, note, feeling)
        } else {
            val request = CreateEntryRequest(
                challengeId = challengeId,
                date = dateStr,
                count = count,
                note = note,
                feeling = feeling
            )
            when (val result = apiClient.createEntry(request)) {
                is ApiResult.Success -> result.data
                is ApiResult.Failure -> {
                    _error.value = result.error.message
                    createLocalEntry(challengeId, count, dateStr, note, feeling)
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
            true // Local delete always succeeds
        } else {
            when (val result = apiClient.deleteChallenge(challengeId)) {
                is ApiResult.Success -> true
                is ApiResult.Failure -> {
                    _error.value = result.error.message
                    true // Still delete locally even if API fails
                }
            }
        }

        if (success) {
            val updated = _challenges.value.filter { it.id != challengeId }
            _challenges.value = updated
            saveChallengesLocally(updated)

            // Also remove entries
            val currentEntries = _entries.value.toMutableMap()
            currentEntries.remove(challengeId)
            _entries.value = currentEntries
            saveEntriesLocally(currentEntries)
        }

        _isLoading.value = false
        return success
    }

    /**
     * Get total count for a challenge from entries.
     */
    fun getTotalCount(challengeId: String): Int {
        return _entries.value[challengeId]?.sumOf { it.count } ?: 0
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

    private fun createLocalChallenge(
        name: String,
        target: Int,
        timeframeType: TimeframeType,
        color: String,
        icon: String
    ): Challenge {
        val now = java.time.Instant.now().toString()
        val (startDate, endDate) = calculateDateRange(timeframeType)
        
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
            createdAt = now,
            updatedAt = now
        )
    }

    private fun createLocalEntry(
        challengeId: String,
        count: Int,
        date: String,
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
            note = note,
            feeling = feeling,
            createdAt = now,
            updatedAt = now
        )
    }

    private fun calculateDateRange(timeframeType: TimeframeType): Pair<String, String> {
        val now = LocalDate.now()
        val formatter = DateTimeFormatter.ISO_LOCAL_DATE
        
        return when (timeframeType) {
            TimeframeType.YEAR -> {
                val start = now.withDayOfYear(1)
                val end = now.withDayOfYear(now.lengthOfYear())
                start.format(formatter) to end.format(formatter)
            }
            TimeframeType.MONTH -> {
                val start = now.withDayOfMonth(1)
                val end = now.withDayOfMonth(now.lengthOfMonth())
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
    }
}
