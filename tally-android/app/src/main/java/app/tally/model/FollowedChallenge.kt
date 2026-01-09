package app.tally.model

import kotlinx.serialization.Serializable

@Serializable
data class FollowedChallenge(
  val _id: String,
  val userId: String,
  val challengeId: String,
  val followedAt: Double,
)
