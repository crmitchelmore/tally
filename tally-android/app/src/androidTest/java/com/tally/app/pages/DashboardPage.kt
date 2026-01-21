package com.tally.app.pages

import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertDoesNotExist

/**
 * Page object for the Dashboard screen.
 */
class DashboardPage(private val composeRule: ComposeTestRule) {
    
    // MARK: - Element Finders
    
    fun dashboard() = composeRule.onNodeWithTag("dashboard")
    
    fun createChallengeButton() = try {
        composeRule.onNodeWithTag("create-challenge-button")
    } catch (e: Exception) {
        composeRule.onNodeWithText("Create Challenge")
    }
    
    fun challengeCard(name: String) = composeRule.onNodeWithText(name, substring = true)
    
    fun emptyState() = composeRule.onNodeWithTag("empty-state")
    
    fun syncStatus() = composeRule.onNodeWithTag("sync-status")
    
    fun quickAddButton(challengeName: String) = 
        composeRule.onNodeWithTag("quick-add-$challengeName")
    
    // MARK: - Actions
    
    fun tapCreateChallenge() {
        try {
            composeRule.onNodeWithTag("create-challenge-button").performClick()
        } catch (e: Exception) {
            composeRule.onNodeWithText("Create Challenge", substring = true).performClick()
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
        challengeCard(name).assertDoesNotExist()
    }
}
