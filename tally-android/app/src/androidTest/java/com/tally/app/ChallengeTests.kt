package com.tally.app

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.tally.app.pages.ChallengeDialogPage
import com.tally.app.pages.ChallengeDetailPage
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
    
    private val dashboardPage by lazy { DashboardPage(composeRule) }
    private val challengeDialog by lazy { ChallengeDialogPage(composeRule) }
    private val challengeDetail by lazy { ChallengeDetailPage(composeRule) }
    
    // MARK: - Creating Challenges
    
    @Test
    fun testCreateYearlyChallengeWithMinimalInput() {
        // Given I am on my dashboard
        composeRule.waitForIdle()
        
        // When I tap create challenge
        dashboardPage.tapCreateChallenge()
        
        // Then I should see the challenge creation dialog
        challengeDialog.assertIsVisible()
        
        // When I create a challenge with minimal input
        challengeDialog.fillChallenge(
            name = TestData.CHALLENGE_NAME,
            target = TestData.CHALLENGE_TARGET,
            timeframe = "Year"
        )
        challengeDialog.tapSave()
        
        // Then I should see the challenge on my dashboard
        composeRule.waitForIdle()
        dashboardPage.assertChallengeExists(TestData.CHALLENGE_NAME)
    }
    
    @Test
    fun testCreateMonthlyChallenge() {
        composeRule.waitForIdle()
        
        dashboardPage.tapCreateChallenge()
        challengeDialog.assertIsVisible()
        
        challengeDialog.fillChallenge(
            name = "Reading",
            target = "4",
            timeframe = "Month"
        )
        challengeDialog.tapSave()
        
        composeRule.waitForIdle()
        dashboardPage.assertChallengeExists("Reading")
    }
    
    // MARK: - Challenge Lifecycle
    
    @Test
    fun testEditExistingChallenge() {
        // First create a challenge
        composeRule.waitForIdle()
        dashboardPage.tapCreateChallenge()
        challengeDialog.fillChallenge(name = "Edit Test", target = "1000")
        challengeDialog.tapSave()
        
        composeRule.waitForIdle()
        dashboardPage.assertChallengeExists("Edit Test")
        
        // Tap to view detail
        dashboardPage.tapChallenge("Edit Test")
        composeRule.waitForIdle()
        
        // Edit the challenge
        challengeDetail.tapEdit()
        composeRule.waitForIdle()
        
        // Change target (implementation may vary)
        challengeDialog.fillChallenge(name = "", target = "1500")
        challengeDialog.tapSave()
        
        // Verify the update
        composeRule.waitForIdle()
        composeRule.onNodeWithText("1500", substring = true).assertExists()
    }
    
    @Test
    fun testDeleteChallengeWithConfirmation() {
        // Create a challenge to delete
        composeRule.waitForIdle()
        dashboardPage.tapCreateChallenge()
        challengeDialog.fillChallenge(name = "Delete Test", target = "100")
        challengeDialog.tapSave()
        
        composeRule.waitForIdle()
        dashboardPage.assertChallengeExists("Delete Test")
        
        // Open detail
        dashboardPage.tapChallenge("Delete Test")
        composeRule.waitForIdle()
        
        // Delete
        challengeDetail.tapDelete()
        
        // Confirm deletion
        composeRule.onNodeWithText("Delete", substring = true).performClick()
        
        // Verify deleted
        composeRule.waitForIdle()
        dashboardPage.assertChallengeNotExists("Delete Test")
    }
    
    // MARK: - Dashboard View
    
    @Test
    fun testViewChallengeInformationOnDashboard() {
        // Create a challenge
        composeRule.waitForIdle()
        dashboardPage.tapCreateChallenge()
        challengeDialog.fillChallenge(name = "Dashboard Test", target = "5000")
        challengeDialog.tapSave()
        
        composeRule.waitForIdle()
        
        // Should display name
        composeRule.onNodeWithText("Dashboard Test", substring = true).assertExists()
        
        // Should display progress info
        composeRule.onNodeWithText("5000", substring = true).assertExists()
    }
}
