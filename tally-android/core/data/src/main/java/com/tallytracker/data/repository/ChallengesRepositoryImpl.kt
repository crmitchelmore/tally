package com.tallytracker.data.repository

import com.tallytracker.data.api.CreateChallengeRequest
import com.tallytracker.data.api.CreateEntryRequest
import com.tallytracker.data.api.TallyApiClient
import com.tallytracker.domain.model.Challenge
import com.tallytracker.domain.model.Entry
import com.tallytracker.domain.repository.ChallengesRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.time.Instant
import java.time.LocalDateTime
import java.time.ZoneId
import java.util.Calendar
import javax.inject.Inject

class ChallengesRepositoryImpl @Inject constructor(
    private val apiClient: TallyApiClient
) : ChallengesRepository {
    
    override fun getChallenges(): Flow<List<Challenge>> = flow {
        val challenges = apiClient.getChallenges()
        val result = challenges.map { dto ->
            val entries = try { apiClient.getEntries(dto._id) } catch (e: Exception) { emptyList() }
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
                currentCount = entries.sumOf { it.count }
            )
        }
        emit(result)
    }
    
    override suspend fun createChallenge(
        name: String,
        target: Int,
        color: String,
        icon: String,
        unit: String,
        isPublic: Boolean
    ): String {
        return apiClient.createChallenge(
            CreateChallengeRequest(
                name = name,
                targetNumber = target,
                color = color,
                icon = icon,
                timeframeUnit = unit,
                year = Calendar.getInstance().get(Calendar.YEAR),
                isPublic = isPublic
            )
        )
    }
    
    override fun getEntries(challengeId: String): Flow<List<Entry>> = flow {
        val entries = apiClient.getEntries(challengeId)
        emit(entries.map { dto ->
            Entry(
                id = dto._id,
                challengeId = dto.challengeId,
                date = dto.date,
                count = dto.count,
                note = dto.note,
                createdAt = LocalDateTime.ofInstant(
                    Instant.ofEpochMilli(dto.createdAt.toLong()),
                    ZoneId.systemDefault()
                )
            )
        })
    }
    
    override suspend fun createEntry(challengeId: String, count: Int, note: String?): String {
        return apiClient.createEntry(
            CreateEntryRequest(
                challengeId = challengeId,
                date = java.time.LocalDate.now().toString(),
                count = count,
                note = note
            )
        )
    }
}
