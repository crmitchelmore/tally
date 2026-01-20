package com.tally.core.network

import com.tally.core.auth.AuthManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.IOException
import java.net.HttpURLConnection
import java.net.URL

/**
 * API client for Tally backend.
 * Uses Bearer auth from AuthManager and snake_case JSON encoding.
 */
class TallyApiClient(
    private val baseUrl: String,
    private val authManager: AuthManager
) {
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }

    // ===== Challenges API =====

    /** List all challenges for the current user */
    suspend fun listChallenges(): ApiResult<List<Challenge>> {
        return get<ChallengesResponse>("/api/v1/challenges").map { it.challenges }
    }

    /** Get a specific challenge */
    suspend fun getChallenge(id: String): ApiResult<Challenge> {
        return get<ChallengeResponse>("/api/v1/challenges/$id").map { it.challenge }
    }

    /** Create a new challenge */
    suspend fun createChallenge(request: CreateChallengeRequest): ApiResult<Challenge> {
        return post<ChallengeResponse>("/api/v1/challenges", json.encodeToString(request))
            .map { it.challenge }
    }

    /** Update a challenge */
    suspend fun updateChallenge(id: String, request: UpdateChallengeRequest): ApiResult<Challenge> {
        return patch<ChallengeResponse>("/api/v1/challenges/$id", json.encodeToString(request))
            .map { it.challenge }
    }

    /** Archive a challenge */
    suspend fun archiveChallenge(id: String): ApiResult<Challenge> {
        return post<ChallengeResponse>("/api/v1/challenges/$id/archive", null)
            .map { it.challenge }
    }

    /** Delete a challenge */
    suspend fun deleteChallenge(id: String): ApiResult<Unit> {
        return delete("/api/v1/challenges/$id")
    }

    // ===== Entries API =====

    /** List entries, optionally filtered by challenge or date */
    suspend fun listEntries(
        challengeId: String? = null,
        date: String? = null,
        startDate: String? = null,
        endDate: String? = null
    ): ApiResult<List<Entry>> {
        val params = mutableListOf<String>()
        challengeId?.let { params.add("challenge_id=$it") }
        date?.let { params.add("date=$it") }
        startDate?.let { params.add("start_date=$it") }
        endDate?.let { params.add("end_date=$it") }
        
        val query = if (params.isNotEmpty()) "?${params.joinToString("&")}" else ""
        return get<EntriesResponse>("/api/v1/entries$query").map { it.entries }
    }

    /** Get a specific entry */
    suspend fun getEntry(id: String): ApiResult<Entry> {
        return get<EntryResponse>("/api/v1/entries/$id").map { it.entry }
    }

    /** Create a new entry */
    suspend fun createEntry(request: CreateEntryRequest): ApiResult<Entry> {
        return post<EntryResponse>("/api/v1/entries", json.encodeToString(request))
            .map { it.entry }
    }

    /** Update an entry */
    suspend fun updateEntry(id: String, request: UpdateEntryRequest): ApiResult<Entry> {
        return patch<EntryResponse>("/api/v1/entries/$id", json.encodeToString(request))
            .map { it.entry }
    }

    /** Delete an entry */
    suspend fun deleteEntry(id: String): ApiResult<Unit> {
        return delete("/api/v1/entries/$id")
    }

    // ===== Stats API =====

    /** Get stats for a specific challenge */
    suspend fun getChallengeStats(challengeId: String): ApiResult<ChallengeStats> {
        return get<ChallengeStatsResponse>("/api/v1/stats/challenge/$challengeId")
            .map { it.stats }
    }

    /** Get dashboard stats */
    suspend fun getDashboardStats(): ApiResult<DashboardStats> {
        return get<DashboardStatsResponse>("/api/v1/stats/dashboard").map { it.stats }
    }

    /** Get personal records */
    suspend fun getPersonalRecords(): ApiResult<PersonalRecords> {
        return get<PersonalRecordsResponse>("/api/v1/stats/records").map { it.records }
    }

    // ===== HTTP Methods =====

    private suspend inline fun <reified T> get(path: String): ApiResult<T> {
        return request("GET", path, null)
    }

    private suspend inline fun <reified T> post(path: String, body: String?): ApiResult<T> {
        return request("POST", path, body)
    }

    private suspend inline fun <reified T> patch(path: String, body: String?): ApiResult<T> {
        return request("PATCH", path, body)
    }

    private suspend fun delete(path: String): ApiResult<Unit> {
        return requestNoContent("DELETE", path)
    }

    private suspend inline fun <reified T> request(
        method: String,
        path: String,
        body: String?
    ): ApiResult<T> = withContext(Dispatchers.IO) {
        try {
            val token = authManager.getToken()
            if (token == null) {
                return@withContext ApiResult.Failure(ApiError.Unauthorized())
            }

            val url = URL("$baseUrl$path")
            val connection = url.openConnection() as HttpURLConnection

            connection.apply {
                requestMethod = method
                setRequestProperty("Authorization", "Bearer $token")
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "application/json")
                connectTimeout = 30_000
                readTimeout = 30_000
                doInput = true
                if (body != null) {
                    doOutput = true
                    outputStream.bufferedWriter().use { it.write(body) }
                }
            }

            val responseCode = connection.responseCode

            when (responseCode) {
                in 200..299 -> {
                    val responseBody = connection.inputStream.bufferedReader().readText()
                    try {
                        val result = json.decodeFromString<T>(responseBody)
                        ApiResult.Success(result)
                    } catch (e: Exception) {
                        ApiResult.Failure(ApiError.ParseError(cause = e))
                    }
                }
                401 -> ApiResult.Failure(ApiError.Unauthorized())
                403 -> ApiResult.Failure(ApiError.Forbidden())
                404 -> ApiResult.Failure(ApiError.NotFound())
                400 -> {
                    val errorBody = connection.errorStream?.bufferedReader()?.readText()
                    val errorResponse = errorBody?.let {
                        try { json.decodeFromString<ErrorResponse>(it) } catch (e: Exception) { null }
                    }
                    ApiResult.Failure(ApiError.BadRequest(
                        message = errorResponse?.error ?: "Invalid request",
                        details = errorResponse?.details
                    ))
                }
                409 -> ApiResult.Failure(ApiError.Conflict())
                429 -> {
                    val retryAfter = connection.getHeaderField("Retry-After")?.toIntOrNull()
                    ApiResult.Failure(ApiError.RateLimited(retryAfterSeconds = retryAfter))
                }
                in 500..599 -> ApiResult.Failure(ApiError.ServerError(statusCode = responseCode))
                else -> ApiResult.Failure(ApiError.Unknown(message = "HTTP $responseCode"))
            }
        } catch (e: IOException) {
            ApiResult.Failure(ApiError.NetworkError(cause = e))
        } catch (e: Exception) {
            ApiResult.Failure(ApiError.Unknown(cause = e))
        }
    }

    private suspend fun requestNoContent(
        method: String,
        path: String
    ): ApiResult<Unit> = withContext(Dispatchers.IO) {
        try {
            val token = authManager.getToken()
            if (token == null) {
                return@withContext ApiResult.Failure(ApiError.Unauthorized())
            }

            val url = URL("$baseUrl$path")
            val connection = url.openConnection() as HttpURLConnection

            connection.apply {
                requestMethod = method
                setRequestProperty("Authorization", "Bearer $token")
                setRequestProperty("Content-Type", "application/json")
                connectTimeout = 30_000
                readTimeout = 30_000
            }

            val responseCode = connection.responseCode

            when (responseCode) {
                in 200..299 -> ApiResult.Success(Unit)
                401 -> ApiResult.Failure(ApiError.Unauthorized())
                403 -> ApiResult.Failure(ApiError.Forbidden())
                404 -> ApiResult.Failure(ApiError.NotFound())
                400 -> ApiResult.Failure(ApiError.BadRequest())
                409 -> ApiResult.Failure(ApiError.Conflict())
                429 -> ApiResult.Failure(ApiError.RateLimited())
                in 500..599 -> ApiResult.Failure(ApiError.ServerError(statusCode = responseCode))
                else -> ApiResult.Failure(ApiError.Unknown(message = "HTTP $responseCode"))
            }
        } catch (e: IOException) {
            ApiResult.Failure(ApiError.NetworkError(cause = e))
        } catch (e: Exception) {
            ApiResult.Failure(ApiError.Unknown(cause = e))
        }
    }
}
