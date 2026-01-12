package app.tally.model

import org.junit.Test
import org.junit.Assert.*
import kotlinx.serialization.json.Json

/**
 * Unit tests for model serialization.
 * Run with: ./gradlew test
 */
class ModelSerializationTest {

  private val json = Json { ignoreUnknownKeys = true }

  @Test
  fun `Challenge deserializes correctly`() {
    val jsonString = """
      {
        "_id": "ch_123",
        "userId": "u_456",
        "name": "Push-ups",
        "targetNumber": 1000.0,
        "year": 2026.0,
        "color": "#ff0000",
        "icon": "dumbbell",
        "timeframeUnit": "year",
        "startDate": null,
        "endDate": null,
        "isPublic": true,
        "archived": false,
        "createdAt": 1234567890.0
      }
    """.trimIndent()

    val challenge = json.decodeFromString<Challenge>(jsonString)

    assertEquals("ch_123", challenge._id)
    assertEquals("u_456", challenge.userId)
    assertEquals("Push-ups", challenge.name)
    assertEquals(1000.0, challenge.targetNumber, 0.01)
    assertEquals(2026.0, challenge.year, 0.01)
    assertEquals("year", challenge.timeframeUnit)
    assertTrue(challenge.isPublic)
    assertFalse(challenge.archived)
  }

  @Test
  fun `Challenge with custom timeframe deserializes`() {
    val jsonString = """
      {
        "_id": "ch_custom",
        "userId": "u_1",
        "name": "30-day Sprint",
        "targetNumber": 300.0,
        "year": 2026.0,
        "color": "#00ff00",
        "icon": "flame",
        "timeframeUnit": "custom",
        "startDate": "2026-03-01",
        "endDate": "2026-03-30",
        "isPublic": false,
        "archived": false,
        "createdAt": 1234567890.0
      }
    """.trimIndent()

    val challenge = json.decodeFromString<Challenge>(jsonString)

    assertEquals("custom", challenge.timeframeUnit)
    assertEquals("2026-03-01", challenge.startDate)
    assertEquals("2026-03-30", challenge.endDate)
  }

  @Test
  fun `Entry deserializes correctly`() {
    val jsonString = """
      {
        "_id": "e_123",
        "userId": "u_1",
        "challengeId": "ch_1",
        "date": "2026-01-09",
        "count": 25.0,
        "note": "Good session",
        "feeling": "moderate",
        "sets": [{"reps": 10.0}, {"reps": 15.0}],
        "createdAt": 1234567890.0
      }
    """.trimIndent()

    val entry = json.decodeFromString<Entry>(jsonString)

    assertEquals("e_123", entry._id)
    assertEquals("ch_1", entry.challengeId)
    assertEquals("2026-01-09", entry.date)
    assertEquals(25.0, entry.count, 0.01)
    assertEquals("Good session", entry.note)
    assertEquals("moderate", entry.feeling)
    assertEquals(2, entry.sets?.size)
  }

  @Test
  fun `Entry without optional fields deserializes`() {
    val jsonString = """
      {
        "_id": "e_456",
        "userId": "u_1",
        "challengeId": "ch_1",
        "date": "2026-01-09",
        "count": 10.0,
        "createdAt": 1234567890.0
      }
    """.trimIndent()

    val entry = json.decodeFromString<Entry>(jsonString)

    assertNull(entry.note)
    assertNull(entry.feeling)
    assertNull(entry.sets)
  }

  @Test
  fun `EntrySet deserializes correctly`() {
    val jsonString = """{"reps": 15.0}"""
    val set = json.decodeFromString<EntrySet>(jsonString)
    assertEquals(15.0, set.reps, 0.01)
  }

  @Test
  fun `LeaderboardRow deserializes correctly`() {
    val jsonString = """
      {
        "challenge": {
          "_id": "ch_pub",
          "userId": "u_1",
          "name": "Public Challenge",
          "targetNumber": 500.0,
          "year": 2026.0,
          "color": "#2196F3",
          "icon": "star",
          "timeframeUnit": "year",
          "isPublic": true,
          "archived": false,
          "createdAt": 1234567890.0
        },
        "followers": 42.0
      }
    """.trimIndent()

    val row = json.decodeFromString<LeaderboardRow>(jsonString)

    assertEquals("Public Challenge", row.challenge.name)
    assertEquals(42.0, row.followers, 0.01)
  }

  @Test
  fun `FollowedChallenge deserializes correctly`() {
    val jsonString = """
      {
        "_id": "fc_1",
        "userId": "u_follower",
        "challengeId": "ch_target",
        "followedAt": 1234567890.0
      }
    """.trimIndent()

    val followed = json.decodeFromString<FollowedChallenge>(jsonString)

    assertEquals("fc_1", followed._id)
    assertEquals("ch_target", followed.challengeId)
  }
}
