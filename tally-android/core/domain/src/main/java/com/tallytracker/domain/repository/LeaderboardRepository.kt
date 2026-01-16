package com.tallytracker.domain.repository

import com.tallytracker.domain.model.LeaderboardEntry

interface LeaderboardRepository {
    suspend fun getLeaderboard(timeRange: String): List<LeaderboardEntry>
}
