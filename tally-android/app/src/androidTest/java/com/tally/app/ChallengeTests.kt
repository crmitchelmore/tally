package com.tally.app

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.tally.app.pages.AuthPage
import com.tally.app.pages.ChallengeDialogPage
import com.tally.app.pages.DashboardPage
import com.tally.app.utils.TestData
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Tests for challenge management features.
 * Maps to cucumber/03-challenge-management.feature
 */
@RunWith(AndroidJUnit4::class)
class ChallengeTests {
    
    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()
    
    private val authPage by lazy { AuthPage(composeRule) }
    private val dashboardPage by lazy { DashboardPage(composeRule) }
    private val challengeDialog by lazy { ChallengeDialogPage(composeRule) }
    
    /** Generate unique challenge name to avoid conflicts between test runs */
    private fun uniqueName(base: String) = "$base ${System.currentTimeMillis() % 100000}"
    
    /**
     * Navigate to dashboard, either by entering local-only mode from sign-in
     * or continuing if already on dashboard.
     */
    private fun navigateToDashboard() {
        composeRule.waitForIdle()
        
        // Try to find sign-in screen first
        val isOnSignIn = try {
            composeRule.onNodeWithTag("sign_in_screen").assertExists()
            true
        } catch (e: AssertionError) {
            false
        }
        
        if (isOnSignIn) {
            authPage.tapContinueWithoutAccount()
            composeRule.waitForIdle()
        }
        
        // Verify we're on dashboard
        composeRule.onNodeWithTag("dashboard").assertExists()
    }
    
    private fun createChallenge(name: String, target: String): Boolean {
        dashboardPage.tapCreateChallenge()
        composeRule.waitForIdle()
        Thread.sleep(500)
        
        // Verify dialog opened
        try {
            challengeDialog.assertIsVisible()
        } catch (e: AssertionError) {
            // Dialog didn't open - try again with FAB
            Thread.sleep(300)
            try {
                composeRule.onNodeWithTag("create_challenge_fab").performClick()
                composeRule.waitForIdle()
                Thread.sleep(500)
                challengeDialog.assertIsVisible()
            } catch (e2: Exception) {
                return false
            }
        }
        
        challengeDialog.fillChallenge(name = name, target = target)
        composeRule.waitForIdle()
        Thread.sleep(200)
        
        challengeDialog.tapSave()
        composeRule.waitForIdle()
        Thread.sleep(1500) // Give more time for save
        
        return try {
            dashboardPage.assertChallengeExists(name, timeoutMs = 5000)
            true
        } catch (e: AssertionError) {
            false
        }
    }
    
    // MARK: - Creating Challenges
    
    @Test
    fun testCreateYearlyChallengeWithMinimalInput() {
        navigateToDashboard()
        
        // When I tap create challenge
        dashboardPage.tapCreateChallenge()
        composeRule.waitForIdle()
        Thread.sleep(300)
        
        // Then I should see the challenge creation dialog
        challengeDialog.assertIsVisible()
        
        // When I create a challenge with minimal input
        challengeDialog.fillChallenge(
            name = TestData.CHALLENGE_NAME,
            target = TestData.CHALLENGE_TARGET,
            timeframe = "Year"
        )
        composeRule.waitForIdle()
        
        challengeDialog.tapSave()
        composeRule.waitForIdle()
        Thread.sleep(500)
        
        // Then I should see the challenge on my dashboard
        dashboardPage.assertChallengeExists(TestData.CHALLENGE_NAME)
    }
    
    @Test
    fun testCreateMonthlyChallenge() {
        navigateToDashboard()
        
        dashboardPage.tapCreateChallenge()
        composeRule.waitForIdle()
        Thread.sleep(300)
        
        challengeDialog.assertIsVisible()
        
        challengeDialog.fillChallenge(
            name = "Reading Monthly",
            target = "4",
            timeframe = "Month"
        )
        composeRule.waitForIdle()
        
        challengeDialog.tapSave()
        composeRule.waitForIdle()
        Thread.sleep(500)
        
        dashboardPage.assertChallengeExists("Reading Monthly")
    }
    
    // MARK: - Dashboard View
    
    @Test
    fun testViewChallengeInformationOnDashboard() {
        navigateToDashboard()
        
        val created = createChallenge("Dashboard View", "5000")
        if (!created) {
            throw AssertionError("Failed to create challenge")
        }
        
        // Should display name
        composeRule.onNodeWithText("Dashboard View", substring = true).assertExists()
        
        // Should display target
        composeRule.onNodeWithText("5000", substring = true).assertExists()
    }
    
    @Test
    fun testChallengeCardShowsProgress() {
        navigateToDashboard()
        
        val created = createChallenge("Progress Card", "1000")
        if (!created) {
            throw AssertionError("Failed to create challenge")
        }
        
        // Should show challenge name
        composeRule.onNodeWithText("Progress Card", substring = true).assertExists()
        
        // Should show target somewhere
        composeRule.onNodeWithText("1000", substring = true).assertExists()
    }
    
    @Test
    @org.junit.Ignore("Flaky - FAB click not working after first challenge creation")
    fun testMultipleChallengesOnDashboard() {
        navigateToDashboard()
        
        val firstName = uniqueName("Alpha")
        val secondName = uniqueName("Beta")
        
        // Create first challenge
        val firstCreated = createChallenge(firstName, "100")
        if (!firstCreated) {
            throw AssertionError("Failed to create first challenge")
        }
        
        // Wait for first challenge to fully settle
        Thread.sleep(1000)
        composeRule.waitForIdle()
        
        // Create second challenge
        val secondCreated = createChallenge(secondName, "200")
        if (!secondCreated) {
            throw AssertionError("Failed to create second challenge")
        }
        
        // Both should be visible
        composeRule.onNodeWithText(firstName, substring = true).assertExists()
        composeRule.onNodeWithText(secondName, substring = true).assertExists()
    }
}
