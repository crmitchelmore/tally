package app.tally.model

import kotlinx.serialization.Serializable

@Serializable
data class LeaderboardRow(
  val challenge: Challenge,
  val followers: Double,
)
