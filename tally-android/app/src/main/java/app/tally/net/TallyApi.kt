package app.tally.net

import app.tally.model.Challenge
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import okhttp3.OkHttpClient
import okhttp3.Request

object TallyApi {
  private val client = OkHttpClient()
  private val json = Json { ignoreUnknownKeys = true }

  var baseUrl: String = "https://bright-jackal-396.convex.site"

  fun getPublicChallenges(): List<Challenge> {
    val req = Request.Builder()
      .url("$baseUrl/api/public/challenges")
      .get()
      .build()

    client.newCall(req).execute().use { res ->
      if (!res.isSuccessful) {
        throw IllegalStateException("HTTP ${res.code}: ${res.body?.string()}")
      }

      val body = res.body?.string() ?: "[]"
      return json.decodeFromString(ListSerializer(Challenge.serializer()), body)
    }
  }
}
