package app.tally.core.model

data class FollowedChallenge(
  val _id: String,
  val userId: String,
  val challengeId: String,
  val createdAt: Double,
)
