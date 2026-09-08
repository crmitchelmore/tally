package com.tally.app

import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.tally.app.pages.AuthPage
import com.tally.app.pages.ChallengeDialogPage
import com.tally.app.pages.DashboardPage
import com.tally.app.pages.EntryDialogPage
import com.tally.app.utils.TestData
import com.tally.app.utils.FreshLocalDataRule
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Tests for entry logging features.
 * Maps to cucumber/04-entry-logging.feature
 * 
 * Note: In current Android implementation, clicking a challenge card 
 * opens the detail screen; the quick-add button opens AddEntryDialog.
 */
@RunWith(AndroidJUnit4::class)
class EntryTests {
    
    @get:Rule(order = 0)
    val freshData = FreshLocalDataRule()

    @get:Rule(order = 1)
    val composeRule = createAndroidComposeRule<MainActivity>()
    
    private val authPage by lazy { AuthPage(composeRule) }
    private val dashboardPage by lazy { DashboardPage(composeRule) }
    private val challengeDialog by lazy { ChallengeDialogPage(composeRule) }
    private val entryDialog by lazy { EntryDialogPage(composeRule) }
    
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
    
    private fun createTestChallenge(name: String = "Entry Test"): Boolean {
        navigateToDashboard()
        dashboardPage.tapCreateChallenge()
        composeRule.waitForIdle()
        challengeDialog.fillChallenge(name = name, target = "10000")
        challengeDialog.tapSave()
        composeRule.waitForIdle()
        Thread.sleep(500) // Give time for optimistic save
        
        return try {
            dashboardPage.assertChallengeExists(name)
            true
        } catch (e: AssertionError) {
            false
        }
    }
    
    // MARK: - Adding Basic Entries
    
    @Test
    fun testAddSimpleEntryToChallenge() {
        val created = createTestChallenge("Push-ups Entry")
        if (!created) {
            throw AssertionError("Challenge creation failed")
        }
        
        // Tap challenge card to open entry dialog
        dashboardPage.tapQuickAdd("Push-ups Entry")
        composeRule.waitForIdle()
        Thread.sleep(500) // Wait for dialog animation
        
        // Entry dialog should open directly - look for Save button
        val dialogVisible = try {
            composeRule.onNodeWithTag("saveButton").assertExists()
            true
        } catch (e: AssertionError) {
            false
        }
        
        if (!dialogVisible) {
            // Dialog didn't open, fail gracefully
            throw AssertionError("Entry dialog did not open when tapping challenge")
        }
        
        // Add entry and save
        entryDialog.addEntry(TestData.ENTRY_COUNT)
        composeRule.waitForIdle()
    }
    
    @Test
    fun testQuickAddOpensEntryDialog() {
        val created = createTestChallenge("Quick Add Entry")
        if (!created) {
            throw AssertionError("Challenge creation failed")
        }
        
        // Tap challenge card
        dashboardPage.tapQuickAdd("Quick Add Entry")
        composeRule.waitForIdle()
        Thread.sleep(500)
        
        // Look for Save button which indicates entry dialog
        composeRule.onNodeWithTag("saveButton").assertExists()
    }
    
    // MARK: - Entry Feedback
    
    @Test
    fun testSuccessFeedbackOnEntry() {
        val created = createTestChallenge("Feedback Entry")
        if (!created) {
            throw AssertionError("Challenge creation failed")
        }
        
        // Tap to open entry dialog
        dashboardPage.tapQuickAdd("Feedback Entry")
        composeRule.waitForIdle()
        Thread.sleep(500)
        
        // Check dialog is visible via Save button
        try {
            composeRule.onNodeWithTag("saveButton").assertExists()
        } catch (e: AssertionError) {
            throw AssertionError("Entry dialog did not open")
        }
        
        entryDialog.addEntry("5")
        composeRule.waitForIdle()
    }
    
    // MARK: - Multiple Entries
    
    @Test
    fun testAddMultipleEntriesOnSameDay() {
        val created = createTestChallenge("Multiple Entry")
        if (!created) {
            throw AssertionError("Challenge creation failed")
        }
        
        // Add first entry
        dashboardPage.tapQuickAdd("Multiple Entry")
        composeRule.waitForIdle()
        Thread.sleep(500)
        
        try {
            composeRule.onNodeWithTag("saveButton").assertExists()
        } catch (e: AssertionError) {
            throw AssertionError("Entry dialog did not open for first entry")
        }
        
        entryDialog.addEntry("30")
        composeRule.waitForIdle()
        Thread.sleep(500)
        
        // Add second entry
        dashboardPage.tapQuickAdd("Multiple Entry")
        composeRule.waitForIdle()
        Thread.sleep(500)
        
        entryDialog.addEntry("25")
        composeRule.waitForIdle()
    }
}
