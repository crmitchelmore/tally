package app.tally.core.model

data class User(
  val _id: String,
  val clerkId: String,
  val email: String?,
  val name: String?,
  val avatarUrl: String?,
  val createdAt: Double,
)
