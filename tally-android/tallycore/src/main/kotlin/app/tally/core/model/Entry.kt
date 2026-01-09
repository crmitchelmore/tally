package app.tally.core.model

data class EntrySet(
  val reps: Double,
)

data class Entry(
  val _id: String,
  val userId: String,
  val challengeId: String,
  val date: String,
  val count: Double,
  val note: String?,
  val sets: List<EntrySet>?,
  val feeling: FeelingType?,
  val createdAt: Double,
)
