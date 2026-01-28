package com.tally.app

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.tally.app.pages.AuthPage
import com.tally.app.pages.ChallengeDialogPage
import com.tally.app.pages.DashboardPage
import com.tally.app.utils.TestData
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Tests for new user onboarding flow.
 * Maps to cucumber/01-new-user-onboarding.feature
 */
@RunWith(AndroidJUnit4::class)
class OnboardingTests {
    
    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()
    
    private val authPage by lazy { AuthPage(composeRule) }
    private val dashboardPage by lazy { DashboardPage(composeRule) }
    private val challengeDialog by lazy { ChallengeDialogPage(composeRule) }
    
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
    
    // MARK: - Empty State
    
    @Test
    fun testSeeingEmptyDashboardAsNewUser() {
        navigateToDashboard()
        
        // As a user in local-only mode, should see empty state or challenges
        val hasDashboard = try {
            composeRule.onNodeWithTag("dashboard").assertExists()
            true
        } catch (e: AssertionError) {
            false
        }
        
        assert(hasDashboard) { "Should be on dashboard" }
    }
    
    // MARK: - Quick Start Flow
    
    @Test
    fun testCreatingFirstChallengeFromEmptyState() {
        navigateToDashboard()
        
        // Tap create challenge
        dashboardPage.tapCreateChallenge()
        composeRule.waitForIdle()
        
        // Should see dialog with required fields
        challengeDialog.assertIsVisible()
    }
    
    @Test
    fun testCompletingQuickStartWithYearlyChallenge() {
        navigateToDashboard()
        
        dashboardPage.tapCreateChallenge()
        composeRule.waitForIdle()
        
        // Create challenge
        challengeDialog.fillChallenge(
            name = TestData.CHALLENGE_NAME,
            target = TestData.CHALLENGE_TARGET,
            timeframe = "Year"
        )
        challengeDialog.tapSave()
        
        // Should see challenge on dashboard
        composeRule.waitForIdle()
        dashboardPage.assertChallengeExists(TestData.CHALLENGE_NAME)
        
        // Should show progress
        composeRule.onNodeWithText("0", substring = true).assertExists()
        composeRule.onNodeWithText(TestData.CHALLENGE_TARGET, substring = true).assertExists()
    }
    
    // MARK: - Understanding the Interface
    
    @Test
    fun testUnderstandingDashboardLayout() {
        navigateToDashboard()
        
        // Create a challenge first
        dashboardPage.tapCreateChallenge()
        composeRule.waitForIdle()
        
        challengeDialog.fillChallenge(name = "Layout Test", target = "5000")
        challengeDialog.tapSave()
        
        composeRule.waitForIdle()
        
        // Verify dashboard elements
        dashboardPage.assertChallengeExists("Layout Test")
        
        // Card should show progress info
        composeRule.onNodeWithText("Layout Test", substring = true).assertExists()
    }
}
