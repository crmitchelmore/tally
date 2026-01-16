package com.tallytracker.domain.repository

import com.tallytracker.domain.model.Challenge
import com.tallytracker.domain.model.Entry
import kotlinx.coroutines.flow.Flow

interface ChallengesRepository {
    fun getChallenges(): Flow<List<Challenge>>
    suspend fun createChallenge(
        name: String,
        target: Int,
        color: String,
        icon: String,
        unit: String,
        isPublic: Boolean
    ): String
    fun getEntries(challengeId: String): Flow<List<Entry>>
    suspend fun createEntry(challengeId: String, count: Int, note: String?): String
}
