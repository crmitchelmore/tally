package com.tally.core.data

import android.content.Context
import android.content.SharedPreferences
import com.tally.core.network.Challenge
import com.tally.core.network.ChallengeStats
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Local persistence for challenges using SharedPreferences.
 * Provides instant load from cache with background refresh.
 * Mirrors iOS LocalChallengeStore pattern.
 */
class LocalChallengeStore(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(
        PREFS_NAME,
        Context.MODE_PRIVATE
    )
    
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }
    
    // MARK: - Challenges CRUD
    
    /** Load all locally stored challenges */
    fun loadChallenges(): List<Challenge> {
        val data = prefs.getString(CHALLENGES_KEY, null) ?: return emptyList()
        return try {
            json.decodeFromString<List<Challenge>>(data)
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    /** Save challenges to local storage */
    fun saveChallenges(challenges: List<Challenge>) {
        val data = json.encodeToString(challenges)
        prefs.edit().putString(CHALLENGES_KEY, data).apply()
    }
    
    /** Get a single challenge by ID */
    fun getChallenge(id: String): Challenge? {
        return loadChallenges().find { it.id == id }
    }
    
    /** Update a single challenge locally */
    fun upsertChallenge(challenge: Challenge) {
        val challenges = loadChallenges().toMutableList()
        val index = challenges.indexOfFirst { it.id == challenge.id }
        if (index >= 0) {
            challenges[index] = challenge
        } else {
            challenges.add(challenge)
        }
        saveChallenges(challenges)
    }
    
    // MARK: - Stats
    
    /** Load cached stats for all challenges */
    fun loadStats(): Map<String, ChallengeStats> {
        val data = prefs.getString(STATS_KEY, null) ?: return emptyMap()
        return try {
            json.decodeFromString<Map<String, ChallengeStats>>(data)
        } catch (e: Exception) {
            emptyMap()
        }
    }
    
    /** Save stats to local storage */
    fun saveStats(stats: Map<String, ChallengeStats>) {
        val data = json.encodeToString(stats)
        prefs.edit().putString(STATS_KEY, data).apply()
    }
    
    /** Get stats for a specific challenge */
    fun getStats(challengeId: String): ChallengeStats? {
        return loadStats()[challengeId]
    }
    
    /** Update stats for a challenge */
    fun upsertStats(challengeId: String, stats: ChallengeStats) {
        val allStats = loadStats().toMutableMap()
        allStats[challengeId] = stats
        saveStats(allStats)
    }
    
    // MARK: - Utilities
    
    /** Clear all local data (for logout) */
    fun clearAll() {
        prefs.edit()
            .remove(CHALLENGES_KEY)
            .remove(STATS_KEY)
            .apply()
    }
    
    /** Check if we have cached data */
    fun hasCachedData(): Boolean {
        return prefs.contains(CHALLENGES_KEY)
    }
    
    companion object {
        private const val PREFS_NAME = "tally_challenges"
        private const val CHALLENGES_KEY = "challenges_data"
        private const val STATS_KEY = "stats_data"
    }
}
