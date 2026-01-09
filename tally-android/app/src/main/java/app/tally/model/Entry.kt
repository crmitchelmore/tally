package app.tally.model

import kotlinx.serialization.Serializable

@Serializable
data class Entry(
  val _id: String,
  val userId: String,
  val challengeId: String,
  val date: String,
  val count: Double,
  val note: String? = null,
  val feeling: String? = null,
  val sets: List<EntrySet>? = null,
  val createdAt: Double,
)
