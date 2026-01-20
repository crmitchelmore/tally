package com.tally.core.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * API response wrappers
 */

@Serializable
data class ChallengeResponse(
    val challenge: Challenge
)

@Serializable
data class ChallengesResponse(
    val challenges: List<Challenge>
)

@Serializable
data class EntryResponse(
    val entry: Entry
)

@Serializable
data class EntriesResponse(
    val entries: List<Entry>
)

@Serializable
data class ChallengeStatsResponse(
    val stats: ChallengeStats
)

@Serializable
data class DashboardStatsResponse(
    val stats: DashboardStats
)

@Serializable
data class PersonalRecordsResponse(
    val records: PersonalRecords
)

@Serializable
data class ErrorResponse(
    val error: String,
    val code: String? = null,
    val details: Map<String, String>? = null
)
