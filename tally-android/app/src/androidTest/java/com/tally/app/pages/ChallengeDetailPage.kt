package com.tally.app.pages

import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.assertIsDisplayed

/**
 * Page object for challenge detail/actions.
 * 
 * Note: Currently Android doesn't have a separate detail screen.
 * Clicking a challenge card opens AddEntryDialog directly.
 * This page object provides helpers for future detail screen or current behavior.
 */
class ChallengeDetailPage(private val composeRule: ComposeTestRule) {
    
    // MARK: - Element Finders
    
    fun addEntryButton() = composeRule.onNodeWithText("Add Entry")
    
    fun editButton() = composeRule.onNodeWithText("Edit")
    
    fun deleteButton() = composeRule.onNodeWithText("Delete")
    
    // MARK: - Actions
    
    /**
     * In current implementation, clicking a challenge opens entry dialog directly.
     * This is a no-op since the dialog is already shown.
     */
    fun tapAddEntry() {
        // Entry dialog opens when challenge card is tapped
        // If there's a dedicated button, tap it
        try {
            addEntryButton().performClick()
        } catch (e: Exception) {
            // Already on entry dialog or no separate button
        }
    }
    
    fun tapEdit() {
        editButton().performClick()
    }
    
    fun tapDelete() {
        deleteButton().performClick()
    }
    
    // MARK: - Assertions
    
    fun assertTitleContains(text: String) {
        composeRule.onNodeWithText(text, substring = true).assertIsDisplayed()
    }
}
