package app.tally.core.model

data class Challenge(
  val _id: String,
  val userId: String,
  val name: String,
  val targetNumber: Double,
  val year: Double,
  val color: String,
  val icon: String,
  val timeframeUnit: TimeframeUnit,
  val startDate: String?,
  val endDate: String?,
  val isPublic: Boolean,
  val archived: Boolean,
  val createdAt: Double,
)
