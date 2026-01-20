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
                "user_id": "user_456",
                "name": "Daily Pushups",
                "target": 1000,
                "timeframe_type": "month",
                "start_date": "2025-01-01",
                "end_date": "2025-01-31",
                "color": "#FF5733",
                "icon": "fitness",
                "is_public": true,
                "is_archived": false,
                "created_at": "2025-01-01T00:00:00Z",
                "updated_at": "2025-01-01T00:00:00Z"
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
                "user_id": "user_456",
                "challenge_id": "ch_123",
                "date": "2025-01-15",
                "count": 50,
                "note": "Morning workout",
                "feeling": "great",
                "created_at": "2025-01-15T08:00:00Z",
                "updated_at": "2025-01-15T08:00:00Z"
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
                "user_id": "user_456",
                "challenge_id": "ch_123",
                "date": "2025-01-15",
                "count": 50,
                "created_at": "2025-01-15T08:00:00Z",
                "updated_at": "2025-01-15T08:00:00Z"
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
                "challenge_id": "ch_123",
                "total_count": 500,
                "remaining": 500,
                "days_elapsed": 15,
                "days_remaining": 16,
                "per_day_required": 31.25,
                "current_pace": 33.33,
                "pace_status": "ahead",
                "streak_current": 5,
                "streak_best": 10,
                "best_day": {"date": "2025-01-10", "count": 100},
                "daily_average": 33.33
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
                "total_marks": 1500,
                "today": 75,
                "best_streak": 14,
                "overall_pace_status": "on-pace"
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
