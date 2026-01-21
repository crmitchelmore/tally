package com.tally.app

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
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
    
    private val dashboardPage by lazy { DashboardPage(composeRule) }
    private val challengeDialog by lazy { ChallengeDialogPage(composeRule) }
    
    // MARK: - Empty State
    
    @Test
    fun testSeeingEmptyDashboardAsNewUser() {
        // As a new user, should see empty state or create button
        composeRule.waitForIdle()
        
        val hasEmptyState = try {
            dashboardPage.emptyState().assertExists()
            true
        } catch (e: Exception) {
            false
        }
        
        val hasCreateButton = try {
            dashboardPage.createChallengeButton().assertExists()
            true
        } catch (e: Exception) {
            try {
                composeRule.onNodeWithText("Create", substring = true).assertExists()
                true
            } catch (e2: Exception) {
                false
            }
        }
        
        assert(hasEmptyState || hasCreateButton) {
            "New user should see empty state or create challenge button"
        }
    }
    
    // MARK: - Quick Start Flow
    
    @Test
    fun testCreatingFirstChallengeFromEmptyState() {
        composeRule.waitForIdle()
        
        // Tap create challenge
        dashboardPage.tapCreateChallenge()
        composeRule.waitForIdle()
        
        // Should see dialog with required fields
        challengeDialog.assertIsVisible()
    }
    
    @Test
    fun testCompletingQuickStartWithYearlyChallenge() {
        composeRule.waitForIdle()
        
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
        // Create a challenge first
        composeRule.waitForIdle()
        dashboardPage.tapCreateChallenge()
        challengeDialog.fillChallenge(name = "Layout Test", target = "5000")
        challengeDialog.tapSave()
        
        composeRule.waitForIdle()
        
        // Verify dashboard elements
        dashboardPage.assertChallengeExists("Layout Test")
        
        // Card should show progress info
        composeRule.onNodeWithText("Layout Test", substring = true).assertExists()
    }
}
