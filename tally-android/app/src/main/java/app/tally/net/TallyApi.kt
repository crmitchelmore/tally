package app.tally.net

import app.tally.BuildConfig
import app.tally.model.Challenge
import app.tally.model.Entry
import app.tally.model.FollowedChallenge
import app.tally.model.LeaderboardRow
import java.net.URLEncoder
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

object TallyApi {
  private val client = OkHttpClient()
  private val json = Json { ignoreUnknownKeys = true }
  private val jsonMediaType = "application/json; charset=utf-8".toMediaType()

  private fun urlEncode(value: String): String = URLEncoder.encode(value, Charsets.UTF_8.name())

  var baseUrl: String = BuildConfig.TALLY_API_BASE_URL

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

  fun getLeaderboard(): List<LeaderboardRow> {
    val req = Request.Builder()
      .url("$baseUrl/api/leaderboard")
      .get()
      .build()

    client.newCall(req).execute().use { res ->
      if (!res.isSuccessful) {
        throw IllegalStateException("HTTP ${res.code}: ${res.body?.string()}")
      }

      val body = res.body?.string() ?: "[]"
      return json.decodeFromString(ListSerializer(LeaderboardRow.serializer()), body)
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

  fun createChallenge(jwt: String, req: CreateChallengeRequest): String {
    val body = json.encodeToString(req)

    val request = Request.Builder()
      .url("$baseUrl/api/challenges")
      .addHeader("Authorization", "Bearer $jwt")
      .post(body.toRequestBody(jsonMediaType))
      .build()

    client.newCall(request).execute().use { res ->
      val raw = res.body?.string()
      if (!res.isSuccessful) {
        throw IllegalStateException("HTTP ${res.code}: $raw")
      }
      val id = raw
        ?.let { json.parseToJsonElement(it).jsonObject["id"]?.jsonPrimitive?.content }
        ?.takeIf { it.isNotBlank() }
      return id ?: throw IllegalStateException("Missing id in response")
    }
  }

  fun updateChallenge(jwt: String, challengeId: String, req: UpdateChallengeRequest): Boolean {
    val body = json.encodeToString(req)

    val request = Request.Builder()
      .url("$baseUrl/api/challenges/${urlEncode(challengeId)}")
      .addHeader("Authorization", "Bearer $jwt")
      .patch(body.toRequestBody(jsonMediaType))
      .build()

    client.newCall(request).execute().use { res ->
      val raw = res.body?.string()
      if (!res.isSuccessful) {
        throw IllegalStateException("HTTP ${res.code}: $raw")
      }
      val success = raw
        ?.let { json.parseToJsonElement(it).jsonObject["success"]?.jsonPrimitive?.content }
        ?.toBooleanStrictOrNull()
      return success ?: true
    }
  }

  fun createEntry(jwt: String, req: CreateEntryRequest): String {
    val body = json.encodeToString(req)

    val request = Request.Builder()
      .url("$baseUrl/api/entries")
      .addHeader("Authorization", "Bearer $jwt")
      .post(body.toRequestBody(jsonMediaType))
      .build()

    client.newCall(request).execute().use { res ->
      val raw = res.body?.string()
      if (!res.isSuccessful) {
        throw IllegalStateException("HTTP ${res.code}: $raw")
      }
      val id = raw
        ?.let { json.parseToJsonElement(it).jsonObject["id"]?.jsonPrimitive?.content }
        ?.takeIf { it.isNotBlank() }
      return id ?: throw IllegalStateException("Missing id in response")
    }
  }

  fun updateEntry(jwt: String, entryId: String, req: UpdateEntryRequest): Boolean {
    val body = json.encodeToString(req)

    val request = Request.Builder()
      .url("$baseUrl/api/entries/${urlEncode(entryId)}")
      .addHeader("Authorization", "Bearer $jwt")
      .patch(body.toRequestBody(jsonMediaType))
      .build()

    client.newCall(request).execute().use { res ->
      val raw = res.body?.string()
      if (!res.isSuccessful) {
        throw IllegalStateException("HTTP ${res.code}: $raw")
      }
      val success = raw
        ?.let { json.parseToJsonElement(it).jsonObject["success"]?.jsonPrimitive?.content }
        ?.toBooleanStrictOrNull()
      return success ?: true
    }
  }

  fun getEntries(jwt: String, challengeId: String): List<Entry> {
    val req = Request.Builder()
      .url("$baseUrl/api/entries?challengeId=${urlEncode(challengeId)}")
      .addHeader("Authorization", "Bearer $jwt")
      .get()
      .build()

    client.newCall(req).execute().use { res ->
      if (!res.isSuccessful) {
        throw IllegalStateException("HTTP ${res.code}: ${res.body?.string()}")
      }

      val body = res.body?.string() ?: "[]"
      return json.decodeFromString(ListSerializer(Entry.serializer()), body)
    }
  }

  fun deleteEntry(jwt: String, entryId: String): Boolean {
    val req = Request.Builder()
      .url("$baseUrl/api/entries/${urlEncode(entryId)}")
      .addHeader("Authorization", "Bearer $jwt")
      .delete()
      .build()

    client.newCall(req).execute().use { res ->
      val raw = res.body?.string()
      if (!res.isSuccessful) {
        throw IllegalStateException("HTTP ${res.code}: $raw")
      }
      val success = raw
        ?.let { json.parseToJsonElement(it).jsonObject["success"]?.jsonPrimitive?.content }
        ?.toBooleanStrictOrNull()
      return success ?: true
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

  fun getFollowed(jwt: String): List<FollowedChallenge> {
    val req = Request.Builder()
      .url("$baseUrl/api/followed")
      .addHeader("Authorization", "Bearer $jwt")
      .get()
      .build()

    client.newCall(req).execute().use { res ->
      if (!res.isSuccessful) {
        throw IllegalStateException("HTTP ${res.code}: ${res.body?.string()}")
      }

      val body = res.body?.string() ?: "[]"
      return json.decodeFromString(ListSerializer(FollowedChallenge.serializer()), body)
    }
  }

  @Serializable
  private data class FollowRequestBody(val challengeId: String)

  fun follow(jwt: String, challengeId: String): String {
    val body = json.encodeToString(FollowRequestBody(challengeId))

    val req = Request.Builder()
      .url("$baseUrl/api/followed")
      .addHeader("Authorization", "Bearer $jwt")
      .post(body.toRequestBody(jsonMediaType))
      .build()

    client.newCall(req).execute().use { res ->
      val raw = res.body?.string()
      if (!res.isSuccessful) {
        throw IllegalStateException("HTTP ${res.code}: $raw")
      }
      val id = raw
        ?.let { json.parseToJsonElement(it).jsonObject["id"]?.jsonPrimitive?.content }
        ?.takeIf { it.isNotBlank() }
      return id ?: throw IllegalStateException("Missing id in response")
    }
  }

  fun unfollow(jwt: String, idOrChallengeId: String): Boolean {
    val req = Request.Builder()
      .url("$baseUrl/api/followed/${urlEncode(idOrChallengeId)}")
      .addHeader("Authorization", "Bearer $jwt")
      .delete()
      .build()

    client.newCall(req).execute().use { res ->
      val raw = res.body?.string()
      if (!res.isSuccessful) {
        throw IllegalStateException("HTTP ${res.code}: $raw")
      }
      val success = raw
        ?.let { json.parseToJsonElement(it).jsonObject["success"]?.jsonPrimitive?.content }
        ?.toBooleanStrictOrNull()
      return success ?: true
    }
  }
}
