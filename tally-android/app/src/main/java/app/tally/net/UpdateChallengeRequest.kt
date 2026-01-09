package app.tally.net

import kotlinx.serialization.Serializable

@Serializable
data class UpdateChallengeRequest(
  val name: String? = null,
  val targetNumber: Double? = null,
  val color: String? = null,
  val icon: String? = null,
  val isPublic: Boolean? = null,
  val archived: Boolean? = null,
)
