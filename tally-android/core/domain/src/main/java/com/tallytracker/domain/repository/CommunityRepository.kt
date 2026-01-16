package com.tallytracker.domain.repository

import com.tallytracker.domain.model.Challenge
import kotlinx.coroutines.flow.Flow

interface CommunityRepository {
    fun getPublicChallenges(): Flow<List<Challenge>>
}
