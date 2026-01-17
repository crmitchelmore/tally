package com.tally.core.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Entry(
  val id: String,
  val challengeId: String,
  val date: String,
  val count: Int,
  val note: String? = null,
  val feeling: Feeling? = null,
  val sets: List<EntrySet>? = null,
  val createdAt: String,
)

@Serializable
data class EntryPayload(
  val challengeId: String,
  val date: String,
  val count: Int,
  val note: String? = null,
  val feeling: Feeling? = null,
  val sets: List<EntrySet>? = null,
)

@Serializable
data class EntrySet(
  val reps: Int,
)

@Serializable
enum class Feeling {
  @SerialName("very-easy")
  VERY_EASY,
  @SerialName("easy")
  EASY,
  @SerialName("moderate")
  MODERATE,
  @SerialName("hard")
  HARD,
  @SerialName("very-hard")
  VERY_HARD,
}
