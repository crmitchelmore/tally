package com.tally.core.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/**
 * API request types
 */

@Serializable
data class CreateChallengeRequest(
    val name: String,
    val target: Int,
    @SerialName("timeframe_type") val timeframeType: TimeframeType,
    @SerialName("period_offset") val periodOffset: Int? = null, // 0 = this period, 1 = next
    @SerialName("start_date") val startDate: String? = null,
    @SerialName("end_date") val endDate: String? = null,
    val color: String? = null,
    val icon: String? = null,
    @SerialName("is_public") val isPublic: Boolean? = null,
    @SerialName("count_type") val countType: CountType? = null,
    @SerialName("unit_label") val unitLabel: String? = null,
    @SerialName("default_increment") val defaultIncrement: Int? = null
)

@Serializable
data class UpdateChallengeRequest(
    val name: String? = null,
    val target: Int? = null,
    val color: String? = null,
    val icon: String? = null,
    @SerialName("is_public") val isPublic: Boolean? = null,
    @SerialName("is_archived") val isArchived: Boolean? = null,
    @SerialName("count_type") val countType: CountType? = null,
    @SerialName("unit_label") val unitLabel: String? = null,
    @SerialName("default_increment") val defaultIncrement: Int? = null
)

@Serializable
data class CreateEntryRequest(
    @SerialName("challenge_id") val challengeId: String,
    val date: String,
    val count: Int,
    val sets: List<Int>? = null,
    val note: String? = null,
    val feeling: Feeling? = null
)

@Serializable
data class UpdateEntryRequest(
    val date: String? = null,
    val count: Int? = null,
    val sets: List<Int>? = null,
    val note: String? = null,
    val feeling: Feeling? = null
)
