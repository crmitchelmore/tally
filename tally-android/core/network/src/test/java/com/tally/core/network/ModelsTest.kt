package com.tally.core.network

import kotlinx.serialization.json.Json
import org.junit.Assert.*
import org.junit.Test

/**
 * Unit tests for API models
 */
class ModelsTest {

    private val json = Json { ignoreUnknownKeys = true }

    @Test
    fun `Challenge deserializes correctly`() {
        val challengeJson = """
            {
                "id": "ch_123",
                "userId": "user_456",
                "name": "Daily Pushups",
                "target": 1000,
                "timeframeType": "month",
                "startDate": "2025-01-01",
                "endDate": "2025-01-31",
                "color": "#FF5733",
                "icon": "fitness",
                "isPublic": true,
                "isArchived": false,
                "createdAt": "2025-01-01T00:00:00Z",
                "updatedAt": "2025-01-01T00:00:00Z"
            }
        """.trimIndent()

        val challenge = json.decodeFromString<Challenge>(challengeJson)

        assertEquals("ch_123", challenge.id)
        assertEquals("user_456", challenge.userId)
        assertEquals("Daily Pushups", challenge.name)
        assertEquals(1000, challenge.target)
        assertEquals(TimeframeType.MONTH, challenge.timeframeType)
        assertEquals("2025-01-01", challenge.startDate)
        assertEquals("2025-01-31", challenge.endDate)
        assertTrue(challenge.isPublic)
        assertFalse(challenge.isArchived)
    }

    @Test
    fun `Entry deserializes correctly`() {
        val entryJson = """
            {
                "id": "en_123",
                "userId": "user_456",
                "challengeId": "ch_123",
                "date": "2025-01-15",
                "count": 50,
                "note": "Morning workout",
                "feeling": "great",
                "createdAt": "2025-01-15T08:00:00Z",
                "updatedAt": "2025-01-15T08:00:00Z"
            }
        """.trimIndent()

        val entry = json.decodeFromString<Entry>(entryJson)

        assertEquals("en_123", entry.id)
        assertEquals("ch_123", entry.challengeId)
        assertEquals("2025-01-15", entry.date)
        assertEquals(50, entry.count)
        assertEquals("Morning workout", entry.note)
        assertEquals(Feeling.GREAT, entry.feeling)
    }

    @Test
    fun `Entry deserializes correctly without optional fields`() {
        val entryJson = """
            {
                "id": "en_123",
                "userId": "user_456",
                "challengeId": "ch_123",
                "date": "2025-01-15",
                "count": 50,
                "createdAt": "2025-01-15T08:00:00Z",
                "updatedAt": "2025-01-15T08:00:00Z"
            }
        """.trimIndent()

        val entry = json.decodeFromString<Entry>(entryJson)

        assertEquals("en_123", entry.id)
        assertEquals(50, entry.count)
        assertNull(entry.note)
        assertNull(entry.feeling)
    }

    @Test
    fun `ChallengeStats deserializes correctly`() {
        val statsJson = """
            {
                "challengeId": "ch_123",
                "totalCount": 500,
                "remaining": 500,
                "daysElapsed": 15,
                "daysRemaining": 16,
                "perDayRequired": 31.25,
                "currentPace": 33.33,
                "paceStatus": "ahead",
                "streakCurrent": 5,
                "streakBest": 10,
                "bestDay": {"date": "2025-01-10", "count": 100},
                "dailyAverage": 33.33
            }
        """.trimIndent()

        val stats = json.decodeFromString<ChallengeStats>(statsJson)

        assertEquals("ch_123", stats.challengeId)
        assertEquals(500, stats.totalCount)
        assertEquals(PaceStatus.AHEAD, stats.paceStatus)
        assertEquals(5, stats.streakCurrent)
        assertNotNull(stats.bestDay)
        assertEquals("2025-01-10", stats.bestDay?.date)
        assertEquals(100, stats.bestDay?.count)
    }

    @Test
    fun `DashboardStats deserializes correctly`() {
        val statsJson = """
            {
                "totalMarks": 1500,
                "today": 75,
                "bestStreak": 14,
                "overallPaceStatus": "on-pace"
            }
        """.trimIndent()

        val stats = json.decodeFromString<DashboardStats>(statsJson)

        assertEquals(1500, stats.totalMarks)
        assertEquals(75, stats.today)
        assertEquals(14, stats.bestStreak)
        assertEquals(PaceStatus.ON_PACE, stats.overallPaceStatus)
    }

    @Test
    fun `TimeframeType enum deserializes correctly`() {
        assertEquals(TimeframeType.YEAR, json.decodeFromString<TimeframeType>("\"year\""))
        assertEquals(TimeframeType.MONTH, json.decodeFromString<TimeframeType>("\"month\""))
        assertEquals(TimeframeType.CUSTOM, json.decodeFromString<TimeframeType>("\"custom\""))
    }

    @Test
    fun `Feeling enum deserializes correctly`() {
        assertEquals(Feeling.GREAT, json.decodeFromString<Feeling>("\"great\""))
        assertEquals(Feeling.GOOD, json.decodeFromString<Feeling>("\"good\""))
        assertEquals(Feeling.OKAY, json.decodeFromString<Feeling>("\"okay\""))
        assertEquals(Feeling.TOUGH, json.decodeFromString<Feeling>("\"tough\""))
    }

    @Test
    fun `PaceStatus enum deserializes correctly`() {
        assertEquals(PaceStatus.AHEAD, json.decodeFromString<PaceStatus>("\"ahead\""))
        assertEquals(PaceStatus.ON_PACE, json.decodeFromString<PaceStatus>("\"on-pace\""))
        assertEquals(PaceStatus.BEHIND, json.decodeFromString<PaceStatus>("\"behind\""))
    }
}
