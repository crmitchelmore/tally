package com.tally.core.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Challenge(
  val id: String,
  val name: String,
  val targetNumber: Int,
  val color: String,
  val icon: String,
  val timeframeUnit: TimeframeUnit,
  val startDate: String? = null,
  val endDate: String? = null,
  val year: Int,
  val isPublic: Boolean,
  val archived: Boolean,
)

@Serializable
data class ChallengePayload(
  val name: String,
  val targetNumber: Int,
  val color: String,
  val icon: String,
  val timeframeUnit: TimeframeUnit,
  val startDate: String? = null,
  val endDate: String? = null,
  val year: Int,
  val isPublic: Boolean,
  val archived: Boolean,
)

@Serializable
enum class TimeframeUnit {
  @SerialName("year")
  YEAR,
  @SerialName("month")
  MONTH,
  @SerialName("custom")
  CUSTOM,
}
