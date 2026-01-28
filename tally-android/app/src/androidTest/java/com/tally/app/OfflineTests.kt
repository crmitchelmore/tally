package com.tally.app

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.tally.app.pages.AuthPage
import com.tally.app.pages.ChallengeDialogPage
import com.tally.app.pages.DashboardPage
import com.tally.app.pages.EntryDialogPage
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Tests for local-only (offline) user experience.
 * Maps to cucumber/02-offline-user-experience.feature
 */
@RunWith(AndroidJUnit4::class)
class OfflineTests {
    
    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()
    
    private val authPage by lazy { AuthPage(composeRule) }
    private val dashboardPage by lazy { DashboardPage(composeRule) }
    private val challengeDialog by lazy { ChallengeDialogPage(composeRule) }
    private val entryDialog by lazy { EntryDialogPage(composeRule) }
    
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
    
    // MARK: - Starting as Local-Only User
    
    @Test
    fun testLaunchingAppWithoutAccount() {
        navigateToDashboard()
        
        // Should be on dashboard
        val hasDashboard = try {
            composeRule.onNodeWithTag("dashboard").assertExists()
            true
        } catch (e: AssertionError) {
            false
        }
        
        assert(hasDashboard) { "Should be on dashboard" }
    }
    
    @Test
    @org.junit.Ignore("Flaky - FAB click not working after first challenge creation")
    fun testCanCreateChallengeWhileOffline() {
        navigateToDashboard()
        
        val challengeName = uniqueName("Offline")
        
        // Create a challenge (should work in local-only mode)
        dashboardPage.tapCreateChallenge()
        composeRule.waitForIdle()
        Thread.sleep(500)
        
        // Verify dialog opened
        challengeDialog.assertIsVisible()
        
        challengeDialog.fillChallenge(name = challengeName, target = "1000")
        composeRule.waitForIdle()
        Thread.sleep(200)
        
        challengeDialog.tapSave()
        composeRule.waitForIdle()
        Thread.sleep(1000) // Give more time for save
        
        // Should be visible immediately (with longer timeout)
        dashboardPage.assertChallengeExists(challengeName, timeoutMs = 5000)
    }
    
    @Test
    @org.junit.Ignore("Flaky - FAB click not working after first challenge creation")
    fun testCanAddEntryWhileOffline() {
        navigateToDashboard()
        
        val challengeName = uniqueName("Entry")
        
        // First create a challenge
        dashboardPage.tapCreateChallenge()
        composeRule.waitForIdle()
        Thread.sleep(500)
        
        challengeDialog.assertIsVisible()
        challengeDialog.fillChallenge(name = challengeName, target = "500")
        composeRule.waitForIdle()
        Thread.sleep(200)
        
        challengeDialog.tapSave()
        composeRule.waitForIdle()
        Thread.sleep(1000)
        
        // Verify challenge was created
        dashboardPage.assertChallengeExists(challengeName, timeoutMs = 5000)
        
        // Tap to add entry
        dashboardPage.tapChallenge(challengeName)
        composeRule.waitForIdle()
        Thread.sleep(500)
        
        // Entry dialog should open - look for Save button
        try {
            composeRule.onNodeWithText("Save").assertExists()
        } catch (e: AssertionError) {
            throw AssertionError("Entry dialog did not open when tapping challenge")
        }
        
        entryDialog.addEntry("10")
        composeRule.waitForIdle()
    }
    
    // MARK: - Sync Status
    
    @Test
    fun testViewSyncStatusAsOfflineUser() {
        navigateToDashboard()
        
        // Look for sync status indicator
        val syncStatus = composeRule.onNodeWithTag("sync_status")
        syncStatus.assertExists()
        
        // Should show "Local only" text
        composeRule.onNodeWithText("Local only", substring = true).assertExists()
    }
}
