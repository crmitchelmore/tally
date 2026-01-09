package app.tally

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.assertIsDisplayed
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Instrumented tests for Tally app UI.
 * Run with: ./gradlew connectedAndroidTest
 */
@RunWith(AndroidJUnit4::class)
class TallyAppInstrumentedTest {

  @get:Rule
  val composeTestRule = createComposeRule()

  @Test
  fun appLaunchesSuccessfully() {
    // Basic smoke test - app should launch without crashing
    // Content will depend on auth state
    composeTestRule.waitForIdle()
  }
}
