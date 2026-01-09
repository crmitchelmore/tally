package app.tally.core.api

import app.tally.core.model.Challenge

/**
 * Placeholder API surface; this will be wired to an HTTP client once the Android Gradle project is created.
 */
interface TallyApi {
  suspend fun getChallenges(bearerToken: String): List<Challenge>
  suspend fun getPublicChallenges(): List<Challenge>
}
