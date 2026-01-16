package com.tallytracker.data.repository

import com.tallytracker.data.api.TallyApiClient
import com.tallytracker.domain.model.Challenge
import com.tallytracker.domain.repository.CommunityRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

class CommunityRepositoryImpl @Inject constructor(
    private val apiClient: TallyApiClient
) : CommunityRepository {
    
    override fun getPublicChallenges(): Flow<List<Challenge>> = flow {
        val challenges = apiClient.getPublicChallenges()
        emit(challenges.map { dto ->
            Challenge(
                id = dto._id,
                name = dto.name,
                target = dto.targetNumber,
                color = dto.color,
                icon = dto.icon,
                unit = dto.timeframeUnit,
                year = dto.year,
                isPublic = dto.isPublic,
                archived = dto.archived,
                currentCount = 0
            )
        })
    }
}
