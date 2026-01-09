package app.tally.net

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement

@Serializable
data class CreateEntryRequest(
  val challengeId: String,
  val date: String,
  val count: Double,
  val note: String? = null,
  val sets: JsonElement? = null,
  val feeling: String? = null,
)
