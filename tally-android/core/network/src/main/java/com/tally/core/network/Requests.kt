package com.tally.core.network

import kotlinx.serialization.Serializable

/**
 * API request types
 */

@Serializable
data class CreateChallengeRequest(
    val name: String,
    val target: Int,
    val timeframeType: TimeframeType,
    val periodOffset: Int? = null,
    val startDate: String? = null,
    val endDate: String? = null,
    val color: String? = null,
    val icon: String? = null,
    val isPublic: Boolean? = null,
    val countType: CountType? = null,
    val unitLabel: String? = null,
    val defaultIncrement: Int? = null
)

@Serializable
data class UpdateChallengeRequest(
    val name: String? = null,
    val target: Int? = null,
    val color: String? = null,
    val icon: String? = null,
    val isPublic: Boolean? = null,
    val isArchived: Boolean? = null,
    val countType: CountType? = null,
    val unitLabel: String? = null,
    val defaultIncrement: Int? = null
)

@Serializable
data class CreateEntryRequest(
    val challengeId: String,
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
