package com.tally.app

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.tally.app.pages.AuthPage
import com.tally.app.pages.ChallengeDialogPage
import com.tally.app.pages.DashboardPage
import org.junit.Before
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
    
    // MARK: - Starting as Offline User
    
    @Test
    fun testLaunchingAppWithoutAccount() {
        navigateToDashboard()
        
        // Should be on dashboard with empty state or create button
        val hasDashboard = try {
            composeRule.onNodeWithTag("dashboard").assertExists()
            true
        } catch (e: AssertionError) {
            false
        }
        
        assert(hasDashboard) { "Should be on dashboard" }
    }
    
    @Test
    fun testCanCreateChallengeWhileOffline() {
        navigateToDashboard()
        
        // Create a challenge (should work in local-only mode)
        dashboardPage.tapCreateChallenge()
        composeRule.waitForIdle()
        
        challengeDialog.fillChallenge(name = "Offline Challenge", target = "1000")
        challengeDialog.tapSave()
        
        // Should be visible immediately
        composeRule.waitForIdle()
        dashboardPage.assertChallengeExists("Offline Challenge")
    }
    
    // MARK: - Sync Status
    
    @Test
    fun testViewSyncStatusAsOfflineUser() {
        navigateToDashboard()
        
        // Look for sync status indicator showing LOCAL_ONLY
        val syncStatus = composeRule.onNodeWithTag("sync_status")
        syncStatus.assertExists()
        
        // Should show "Local only" text
        composeRule.onNodeWithText("Local only", substring = true).assertExists()
    }
}
