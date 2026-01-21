package com.tally.app.pages

import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.assertIsDisplayed

/**
 * Page object for the Challenge detail screen.
 */
class ChallengeDetailPage(private val composeRule: ComposeTestRule) {
    
    // MARK: - Element Finders
    
    fun title() = composeRule.onNodeWithTag("challenge-title")
    
    fun progressRing() = composeRule.onNodeWithTag("progress-ring")
    
    fun paceStatus() = composeRule.onNodeWithTag("pace-status")
    
    fun heatmap() = composeRule.onNodeWithTag("activity-heatmap")
    
    fun addEntryButton() = composeRule.onNodeWithText("Add Entry")
    
    fun editButton() = composeRule.onNodeWithText("Edit")
    
    fun deleteButton() = composeRule.onNodeWithText("Delete")
    
    fun archiveButton() = composeRule.onNodeWithText("Archive")
    
    fun backButton() = composeRule.onNodeWithTag("back-button")
    
    // MARK: - Actions
    
    fun tapAddEntry() {
        addEntryButton().performClick()
    }
    
    fun tapEdit() {
        editButton().performClick()
    }
    
    fun tapDelete() {
        deleteButton().performClick()
    }
    
    fun tapBack() {
        try {
            backButton().performClick()
        } catch (e: Exception) {
            composeRule.onNodeWithContentDescription("Back").performClick()
        }
    }
    
    // MARK: - Assertions
    
    fun assertTitleContains(text: String) {
        composeRule.onNodeWithText(text, substring = true).assertIsDisplayed()
    }
}
