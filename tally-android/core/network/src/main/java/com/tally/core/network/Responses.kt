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
data class ChallengeWithStats(
    val challenge: Challenge,
    val stats: ChallengeStats
)

@Serializable
data class ChallengesResponse(
    val challenges: List<ChallengeWithStats>
)

@Serializable
data class ChallengeWithStatsWrapper(
    val challenge: Challenge,
    val stats: ChallengeStats
)

@Serializable
data class ChallengesWithStatsResponse(
    val challenges: List<ChallengeWithStatsWrapper>
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
data class DashboardDataResponse(
    val dashboard: DashboardStats,
    val records: PersonalRecords,
    val entries: List<Entry>? = null
)

@Serializable
data class ErrorResponse(
    val error: String,
    val code: String? = null,
    val details: Map<String, String>? = null
)

// ===== Community Responses =====

@Serializable
data class PublicChallengeOwner(
    val id: String,
    val name: String,
    val avatar: String? = null
)

@Serializable
data class PublicChallenge(
    val id: String,
    val name: String,
    val target: Int,
    @SerialName("timeframe_type") val timeframeType: TimeframeType,
    @SerialName("start_date") val startDate: String,
    @SerialName("end_date") val endDate: String,
    val color: String,
    val icon: String,
    @SerialName("total_reps") val totalReps: Int,
    val progress: Double,
    @SerialName("follower_count") val followerCount: Int,
    val owner: PublicChallengeOwner,
    @SerialName("is_following") val isFollowing: Boolean? = null
)

@Serializable
data class PublicChallengesResponse(
    val challenges: List<PublicChallenge>
)

@Serializable
data class FollowResponse(
    val success: Boolean
)

// ===== Export/Import Responses =====

@Serializable
data class ExportChallengeData(
    val id: String,
    val name: String,
    val target: Int,
    @SerialName("timeframe_type") val timeframeType: TimeframeType,
    @SerialName("start_date") val startDate: String,
    @SerialName("end_date") val endDate: String,
    val color: String,
    val icon: String,
    @SerialName("is_public") val isPublic: Boolean,
    @SerialName("is_archived") val isArchived: Boolean,
    @SerialName("count_type") val countType: CountType? = null,
    @SerialName("unit_label") val unitLabel: String? = null,
    @SerialName("default_increment") val defaultIncrement: Int? = null
)

@Serializable
data class ExportEntryData(
    val id: String,
    @SerialName("challenge_id") val challengeId: String,
    val date: String,
    val count: Int,
    val sets: List<Int>? = null,
    val note: String? = null,
    val feeling: Feeling? = null
)

@Serializable
data class ExportData(
    val version: Int = 1,
    @SerialName("exported_at") val exportedAt: String,
    val challenges: List<ExportChallengeData>,
    val entries: List<ExportEntryData>,
    @SerialName("dashboard_config") val dashboardConfig: DashboardConfig? = null
)

@Serializable
data class ExportDataResponse(
    val data: ExportData
)

@Serializable
data class ImportDataRequest(
    val data: ExportData
)

@Serializable
data class ImportDataResponse(
    val success: Boolean,
    val imported: ImportCounts
)

@Serializable
data class ImportCounts(
    val challenges: Int,
    val entries: Int
)

@Serializable
data class DeleteDataResponse(
    val success: Boolean
)
