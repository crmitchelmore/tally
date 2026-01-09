package app.tally.net

import kotlinx.serialization.Serializable

@Serializable
data class UpdateEntryRequest(
  val count: Double? = null,
  val note: String? = null,
  val date: String? = null,
)
