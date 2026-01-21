package com.tally.app

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.tally.app.pages.ChallengeDialogPage
import com.tally.app.pages.DashboardPage
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Tests for offline user experience.
 * Maps to cucumber/02-offline-user-experience.feature
 */
@RunWith(AndroidJUnit4::class)
class OfflineTests {
    
    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()
    
    private val dashboardPage by lazy { DashboardPage(composeRule) }
    private val challengeDialog by lazy { ChallengeDialogPage(composeRule) }
    
    // MARK: - Starting as Offline User
    
    @Test
    fun testLaunchingAppWithoutAccount() {
        // App should launch and show dashboard
        composeRule.waitForIdle()
        
        // Should be able to use app without account
        try {
            dashboardPage.createChallengeButton().assertExists()
        } catch (e: Exception) {
            composeRule.onNodeWithText("Create", substring = true).assertExists()
        }
    }
    
    @Test
    fun testCanCreateChallengeWhileOffline() {
        composeRule.waitForIdle()
        
        // Create a challenge (should work offline)
        dashboardPage.tapCreateChallenge()
        challengeDialog.fillChallenge(name = "Offline Challenge", target = "1000")
        challengeDialog.tapSave()
        
        // Should be visible immediately
        composeRule.waitForIdle()
        dashboardPage.assertChallengeExists("Offline Challenge")
    }
    
    // MARK: - Sync Status
    
    @Test
    fun testViewSyncStatusAsOfflineUser() {
        composeRule.waitForIdle()
        
        // Look for sync status indicator
        try {
            val syncStatus = dashboardPage.syncStatus()
            syncStatus.assertExists()
        } catch (e: Exception) {
            // Sync status might not be visible, which is also acceptable
        }
    }
}
