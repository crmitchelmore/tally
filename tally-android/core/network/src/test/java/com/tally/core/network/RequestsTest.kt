package com.tally.core.network

import kotlinx.serialization.json.Json
import org.junit.Assert.*
import org.junit.Test

/**
 * Unit tests for API request types
 */
class RequestsTest {

    private val json = Json { ignoreUnknownKeys = true; encodeDefaults = true }

    @Test
    fun `CreateChallengeRequest serializes correctly`() {
        val request = CreateChallengeRequest(
            name = "Daily Pushups",
            target = 1000,
            timeframeType = TimeframeType.MONTH,
            startDate = "2025-01-01",
            endDate = "2025-01-31",
            color = "#FF5733",
            icon = "fitness",
            isPublic = true
        )

        val jsonString = json.encodeToString(CreateChallengeRequest.serializer(), request)

        assertTrue(jsonString.contains("\"name\":\"Daily Pushups\""))
        assertTrue(jsonString.contains("\"target\":1000"))
        assertTrue(jsonString.contains("\"timeframe_type\":\"month\""))
        assertTrue(jsonString.contains("\"start_date\":\"2025-01-01\""))
        assertTrue(jsonString.contains("\"is_public\":true"))
    }

    @Test
    fun `CreateChallengeRequest with minimal fields serializes correctly`() {
        val request = CreateChallengeRequest(
            name = "Test",
            target = 100,
            timeframeType = TimeframeType.YEAR
        )

        val jsonString = json.encodeToString(CreateChallengeRequest.serializer(), request)

        assertTrue(jsonString.contains("\"name\":\"Test\""))
        assertTrue(jsonString.contains("\"target\":100"))
        assertTrue(jsonString.contains("\"timeframe_type\":\"year\""))
    }

    @Test
    fun `UpdateChallengeRequest serializes only provided fields`() {
        val request = UpdateChallengeRequest(
            name = "Updated Name",
            isArchived = true
        )

        val jsonString = json.encodeToString(UpdateChallengeRequest.serializer(), request)

        assertTrue(jsonString.contains("\"name\":\"Updated Name\""))
        assertTrue(jsonString.contains("\"is_archived\":true"))
    }

    @Test
    fun `CreateEntryRequest serializes correctly`() {
        val request = CreateEntryRequest(
            challengeId = "ch_123",
            date = "2025-01-15",
            count = 50,
            note = "Morning workout",
            feeling = Feeling.GREAT
        )

        val jsonString = json.encodeToString(CreateEntryRequest.serializer(), request)

        assertTrue(jsonString.contains("\"challenge_id\":\"ch_123\""))
        assertTrue(jsonString.contains("\"date\":\"2025-01-15\""))
        assertTrue(jsonString.contains("\"count\":50"))
        assertTrue(jsonString.contains("\"note\":\"Morning workout\""))
        assertTrue(jsonString.contains("\"feeling\":\"great\""))
    }

    @Test
    fun `UpdateEntryRequest serializes only provided fields`() {
        val request = UpdateEntryRequest(
            count = 75,
            feeling = Feeling.GOOD
        )

        val jsonString = json.encodeToString(UpdateEntryRequest.serializer(), request)

        assertTrue(jsonString.contains("\"count\":75"))
        assertTrue(jsonString.contains("\"feeling\":\"good\""))
    }
}
