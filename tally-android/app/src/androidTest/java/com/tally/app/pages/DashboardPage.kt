package com.tally.app.pages

import androidx.compose.ui.test.hasTestTag
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
    }
    
    fun tapChallenge(name: String) {
        challengeCard(name).performClick()
    }
    
    // MARK: - Assertions
    
    fun assertChallengeExists(name: String) {
        challengeCard(name).assertIsDisplayed()
    }
    
    fun assertChallengeNotExists(name: String) {
        val exists = composeRule
            .onAllNodes(hasTestTag(name))
            .fetchSemanticsNodes()
            .isNotEmpty()
        if (exists) {
            throw AssertionError("Challenge '$name' should not exist")
        }
    }
}
