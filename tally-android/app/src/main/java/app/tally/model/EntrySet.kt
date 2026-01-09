package app.tally.model

import kotlinx.serialization.Serializable

@Serializable
data class EntrySet(
  val reps: Double,
  val weight: Double? = null,
)
