package com.tallytracker.data.repository

import com.tallytracker.data.api.TallyApiClient
import com.tallytracker.domain.model.LeaderboardEntry
import com.tallytracker.domain.repository.LeaderboardRepository
import javax.inject.Inject

class LeaderboardRepositoryImpl @Inject constructor(
    private val apiClient: TallyApiClient
) : LeaderboardRepository {
    
    override suspend fun getLeaderboard(timeRange: String): List<LeaderboardEntry> {
        return apiClient.getLeaderboard(timeRange).map { dto ->
            LeaderboardEntry(
                id = dto.clerkId,
                name = dto.name,
                avatarUrl = dto.avatarUrl,
                total = dto.total,
                rank = dto.rank
            )
        }
    }
}
