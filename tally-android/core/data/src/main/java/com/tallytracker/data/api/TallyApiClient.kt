package com.tallytracker.data.api

import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.engine.okhttp.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.request.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Serializable
data class ApiResponse<T>(val data: T)

@Serializable
data class ChallengeDto(
    val _id: String,
    val name: String,
    val targetNumber: Int,
    val color: String,
    val icon: String,
    val timeframeUnit: String,
    val year: Int,
    val isPublic: Boolean,
    val archived: Boolean,
    val createdAt: Double
)

@Serializable
data class EntryDto(
    val _id: String,
    val challengeId: String,
    val date: String,
    val count: Int,
    val note: String? = null,
    val feeling: String? = null,
    val createdAt: Double
)

@Serializable
data class LeaderboardEntryDto(
    val clerkId: String,
    val name: String? = null,
    val avatarUrl: String? = null,
    val total: Int,
    val rank: Int
)

@Serializable
data class CreateChallengeRequest(
    val name: String,
    val targetNumber: Int,
    val color: String,
    val icon: String,
    val timeframeUnit: String,
    val year: Int,
    val isPublic: Boolean
)

@Serializable
data class CreateEntryRequest(
    val challengeId: String,
    val date: String,
    val count: Int,
    val note: String? = null
)

@Serializable
data class IdResponse(val id: String)

@Singleton
class TallyApiClient @Inject constructor() {
    private val baseUrl = "https://curious-panther-737.convex.site"
    private var authToken: String? = null
    
    private val client = HttpClient(OkHttp) {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
            })
        }
        defaultRequest {
            contentType(ContentType.Application.Json)
        }
    }
    
    fun setAuthToken(token: String?) {
        authToken = token
    }
    
    suspend fun getChallenges(): List<ChallengeDto> {
        val response: ApiResponse<List<ChallengeDto>> = client.get("$baseUrl/api/v1/challenges") {
            authToken?.let { header(HttpHeaders.Authorization, "Bearer $it") }
        }.body()
        return response.data
    }
    
    suspend fun createChallenge(request: CreateChallengeRequest): String {
        val response: ApiResponse<IdResponse> = client.post("$baseUrl/api/v1/challenges") {
            authToken?.let { header(HttpHeaders.Authorization, "Bearer $it") }
            setBody(request)
        }.body()
        return response.data.id
    }
    
    suspend fun getEntries(challengeId: String): List<EntryDto> {
        val response: ApiResponse<List<EntryDto>> = client.get("$baseUrl/api/v1/entries") {
            authToken?.let { header(HttpHeaders.Authorization, "Bearer $it") }
            parameter("challengeId", challengeId)
        }.body()
        return response.data
    }
    
    suspend fun createEntry(request: CreateEntryRequest): String {
        val response: ApiResponse<IdResponse> = client.post("$baseUrl/api/v1/entries") {
            authToken?.let { header(HttpHeaders.Authorization, "Bearer $it") }
            setBody(request)
        }.body()
        return response.data.id
    }
    
    suspend fun getPublicChallenges(): List<ChallengeDto> {
        val response: ApiResponse<List<ChallengeDto>> = client.get("$baseUrl/api/v1/public-challenges").body()
        return response.data
    }
    
    suspend fun getLeaderboard(timeRange: String): List<LeaderboardEntryDto> {
        val response: ApiResponse<List<LeaderboardEntryDto>> = client.get("$baseUrl/api/v1/leaderboard") {
            parameter("timeRange", timeRange)
        }.body()
        return response.data
    }
}
