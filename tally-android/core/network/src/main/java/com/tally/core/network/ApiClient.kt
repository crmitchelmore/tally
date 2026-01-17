package com.tally.core.network

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.logging.HttpLoggingInterceptor
import kotlinx.serialization.encodeToString
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json

class ApiClient(config: ApiConfig) {
  private val json = Json { ignoreUnknownKeys = true }
  private val client = OkHttpClient.Builder()
    .addInterceptor(HttpLoggingInterceptor().setLevel(HttpLoggingInterceptor.Level.BASIC))
    .build()
  private val baseUrl = config.baseUrl

  private suspend fun execute(request: Request): Result<String> = withContext(Dispatchers.IO) {
    try {
      client.newCall(request).execute().use { response ->
        if (!response.isSuccessful) {
          return@withContext Result.failure(IllegalStateException("HTTP ${response.code}"))
        }
        Result.success(response.body?.string().orEmpty())
      }
    } catch (e: Exception) {
      Result.failure(e)
    }
  }

  private fun jsonRequest(
    url: String,
    token: String,
    method: String,
    body: String? = null
  ): Request {
    val builder = Request.Builder()
      .url(url)
      .addHeader("Authorization", "Bearer $token")
    val requestBody = body?.toRequestBody("application/json".toMediaType())
    return when (method) {
      "POST" -> builder.post(requestBody ?: "".toRequestBody("application/json".toMediaType())).build()
      "PATCH" -> builder.patch(requestBody ?: "".toRequestBody("application/json".toMediaType())).build()
      "DELETE" -> if (requestBody != null) builder.delete(requestBody).build() else builder.delete().build()
      else -> builder.get().build()
    }
  }

  suspend fun postAuthUser(token: String): Result<AuthUserResponse> {
    val request = jsonRequest("$baseUrl/auth/user", token, "POST")
    return execute(request).mapCatching { json.decodeFromString(AuthUserResponse.serializer(), it) }
  }

  suspend fun listChallenges(token: String, active: Boolean? = null): Result<List<Challenge>> {
    val url = if (active == null) "$baseUrl/challenges" else "$baseUrl/challenges?active=$active"
    val request = jsonRequest(url, token, "GET")
    return execute(request).mapCatching {
      json.decodeFromString(ListSerializer(Challenge.serializer()), it)
    }
  }

  suspend fun createChallenge(token: String, payload: ChallengePayload): Result<Challenge> {
    val request = jsonRequest(
      "$baseUrl/challenges",
      token,
      "POST",
      json.encodeToString(payload)
    )
    return execute(request).mapCatching {
      json.decodeFromString(Challenge.serializer(), it)
    }
  }

  suspend fun updateChallenge(token: String, id: String, payload: ChallengePayload): Result<Challenge> {
    val request = jsonRequest(
      "$baseUrl/challenges/$id",
      token,
      "PATCH",
      json.encodeToString(payload)
    )
    return execute(request).mapCatching {
      json.decodeFromString(Challenge.serializer(), it)
    }
  }

  suspend fun deleteChallenge(token: String, id: String): Result<DeletedResponse> {
    val request = jsonRequest("$baseUrl/challenges/$id", token, "DELETE")
    return execute(request).mapCatching {
      json.decodeFromString(DeletedResponse.serializer(), it)
    }
  }

  suspend fun listEntries(
    token: String,
    challengeId: String? = null,
    date: String? = null
  ): Result<List<Entry>> {
    val query = buildList {
      if (!challengeId.isNullOrBlank()) add("challengeId=$challengeId")
      if (!date.isNullOrBlank()) add("date=$date")
    }.joinToString("&")
    val url = if (query.isNotBlank()) "$baseUrl/entries?$query" else "$baseUrl/entries"
    val request = jsonRequest(url, token, "GET")
    return execute(request).mapCatching {
      json.decodeFromString(ListSerializer(Entry.serializer()), it)
    }
  }

  suspend fun createEntry(token: String, payload: EntryPayload): Result<Entry> {
    val request = jsonRequest(
      "$baseUrl/entries",
      token,
      "POST",
      json.encodeToString(payload)
    )
    return execute(request).mapCatching {
      json.decodeFromString(Entry.serializer(), it)
    }
  }

  suspend fun updateEntry(token: String, id: String, payload: EntryPayload): Result<Entry> {
    val request = jsonRequest(
      "$baseUrl/entries/$id",
      token,
      "PATCH",
      json.encodeToString(payload)
    )
    return execute(request).mapCatching {
      json.decodeFromString(Entry.serializer(), it)
    }
  }

  suspend fun deleteEntry(token: String, id: String): Result<DeletedResponse> {
    val request = jsonRequest("$baseUrl/entries/$id", token, "DELETE")
    return execute(request).mapCatching {
      json.decodeFromString(DeletedResponse.serializer(), it)
    }
  }

  suspend fun listFollowed(token: String): Result<List<Followed>> {
    val request = jsonRequest("$baseUrl/followed", token, "GET")
    return execute(request).mapCatching {
      json.decodeFromString(ListSerializer(Followed.serializer()), it)
    }
  }

  suspend fun followChallenge(token: String, challengeId: String): Result<Followed> {
    val payload = FollowedPayload(challengeId = challengeId)
    val request = jsonRequest(
      "$baseUrl/followed",
      token,
      "POST",
      json.encodeToString(payload)
    )
    return execute(request).mapCatching {
      json.decodeFromString(Followed.serializer(), it)
    }
  }

  suspend fun unfollowChallenge(token: String, followedId: String): Result<DeletedResponse> {
    val request = jsonRequest("$baseUrl/followed/$followedId", token, "DELETE")
    return execute(request).mapCatching {
      json.decodeFromString(DeletedResponse.serializer(), it)
    }
  }

  suspend fun listPublicChallenges(): Result<List<PublicChallenge>> {
    val request = Request.Builder().url("$baseUrl/public/challenges").get().build()
    return execute(request).mapCatching {
      json.decodeFromString(ListSerializer(PublicChallenge.serializer()), it)
    }
  }
}
