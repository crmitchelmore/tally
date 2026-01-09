package app.tally.net

import kotlinx.serialization.Serializable

@Serializable
data class CreateChallengeRequest(
  val name: String,
  val targetNumber: Double,
  val year: Double,
  val color: String,
  val icon: String,
  val timeframeUnit: String,
  val startDate: String? = null,
  val endDate: String? = null,
  val isPublic: Boolean = false,
)
