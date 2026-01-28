package com.tally.app.pages

import androidx.compose.ui.test.hasTestTag
import androidx.compose.ui.test.hasText
import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.assertIsDisplayed

/**
 * Page object for the Dashboard screen.
 */
class DashboardPage(private val composeRule: ComposeTestRule) {
    
    // MARK: - Element Finders
    
    fun dashboard() = composeRule.onNodeWithTag("dashboard")
    
    fun createChallengeButton() = composeRule.onNodeWithTag("create_challenge_button")
    
    fun createChallengeFab() = composeRule.onNodeWithTag("create_challenge_fab")
    
    fun challengeCard(name: String) = composeRule.onNodeWithText(name, substring = true)
    
    fun emptyState() = composeRule.onNodeWithTag("empty_state")
    
    fun syncStatus() = composeRule.onNodeWithTag("sync_status")
    
    fun quickAddButton(challengeName: String) = 
        composeRule.onNodeWithTag("quick_add_$challengeName")
    
    // MARK: - Actions
    
    fun tapCreateChallenge() {
        composeRule.waitForIdle()
        // First check if the empty state button exists
        val buttonExists = composeRule
            .onAllNodes(hasTestTag("create_challenge_button"))
            .fetchSemanticsNodes()
            .isNotEmpty()
        
        if (buttonExists) {
            composeRule.onNodeWithTag("create_challenge_button").performClick()
        } else {
            // Try FAB if button not visible (when challenges exist)
            composeRule.onNodeWithTag("create_challenge_fab").performClick()
        }
        composeRule.waitForIdle()
    }
    
    fun tapChallenge(name: String) {
        composeRule.waitForIdle()
        challengeCard(name).performClick()
        composeRule.waitForIdle()
    }
    
    // MARK: - Assertions
    
    fun assertChallengeExists(name: String, timeoutMs: Long = 2000) {
        val startTime = System.currentTimeMillis()
        var lastError: AssertionError? = null
        
        while (System.currentTimeMillis() - startTime < timeoutMs) {
            composeRule.waitForIdle()
            try {
                // Check if node with text exists
                val exists = composeRule
                    .onAllNodes(hasText(name, substring = true))
                    .fetchSemanticsNodes()
                    .isNotEmpty()
                
                if (exists) {
                    challengeCard(name).assertIsDisplayed()
                    return
                }
            } catch (e: AssertionError) {
                lastError = e
            }
            Thread.sleep(100)
        }
        
        throw lastError ?: AssertionError("Challenge '$name' not found within ${timeoutMs}ms")
    }
    
    fun assertChallengeNotExists(name: String) {
        composeRule.waitForIdle()
        val exists = composeRule
            .onAllNodes(hasText(name, substring = true))
            .fetchSemanticsNodes()
            .isNotEmpty()
        if (exists) {
            throw AssertionError("Challenge '$name' should not exist")
        }
    }
}
