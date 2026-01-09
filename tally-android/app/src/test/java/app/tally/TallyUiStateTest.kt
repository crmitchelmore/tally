package app.tally

import org.junit.Test
import org.junit.Assert.*

/**
 * Unit tests for TallyUiState.
 * Run with: ./gradlew test
 */
class TallyUiStateTest {

  @Test
  fun `initial state has empty collections`() {
    val state = TallyUiState()
    assertTrue(state.challenges.isEmpty())
    assertTrue(state.publicChallenges.isEmpty())
    assertTrue(state.leaderboard.isEmpty())
    assertTrue(state.followedChallengeIds.isEmpty())
    assertTrue(state.entries.isEmpty())
  }

  @Test
  fun `initial state has no selections`() {
    val state = TallyUiState()
    assertNull(state.selectedChallengeId)
    assertNull(state.selectedEntry)
    assertNull(state.status)
    assertNull(state.error)
  }

  @Test
  fun `initial state has correct flags`() {
    val state = TallyUiState()
    assertFalse(state.isLoading)
    assertFalse(state.showCreateChallenge)
    assertFalse(state.showAddEntry)
    assertFalse(state.showEditEntry)
    assertFalse(state.showChallengeSettings)
    assertEquals(0, state.currentTab)
  }

  @Test
  fun `copy preserves other fields`() {
    val state = TallyUiState()
    val updated = state.copy(isLoading = true, currentTab = 2)

    assertTrue(updated.isLoading)
    assertEquals(2, updated.currentTab)
    // Other fields unchanged
    assertTrue(updated.challenges.isEmpty())
    assertFalse(updated.showCreateChallenge)
  }
}
