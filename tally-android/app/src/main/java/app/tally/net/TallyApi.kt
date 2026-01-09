package app.tally.net

import app.tally.model.Challenge
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

object TallyApi {
  private val client = OkHttpClient()
  private val json = Json { ignoreUnknownKeys = true }
  private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

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

  fun ensureUser(jwt: String) {
    val req = Request.Builder()
      .url("$baseUrl/api/auth/user")
      .addHeader("Authorization", "Bearer $jwt")
      .post("{}".toRequestBody(jsonMediaType))
      .build()

    client.newCall(req).execute().use { res ->
      if (!res.isSuccessful) {
        throw IllegalStateException("HTTP ${res.code}: ${res.body?.string()}")
      }
    }
  }

  fun getChallenges(jwt: String): List<Challenge> {
    val req = Request.Builder()
      .url("$baseUrl/api/challenges")
      .addHeader("Authorization", "Bearer $jwt")
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
