package com.tally.app.pages

import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.assertIsDisplayed

/**
 * Page object for the Entry input dialog.
 */
class EntryDialogPage(private val composeRule: ComposeTestRule) {
    
    // MARK: - Element Finders
    
    fun dialog() = composeRule.onNodeWithTag("entry-dialog")
    
    fun countTextField() = composeRule.onNodeWithTag("entry-count-input")
    
    fun dateInput() = composeRule.onNodeWithTag("entry-date-input")
    
    fun noteTextField() = composeRule.onNodeWithTag("entry-note-input")
    
    fun addSetsButton() = composeRule.onNodeWithText("Add Sets")
    
    fun addButton() = composeRule.onNodeWithText("Add")
    
    fun cancelButton() = composeRule.onNodeWithText("Cancel")
    
    // MARK: - Actions
    
    fun enterCount(count: String) {
        try {
            countTextField().performTextInput(count)
        } catch (e: Exception) {
            composeRule.onNodeWithText("Count", substring = true).performTextInput(count)
        }
    }
    
    fun addEntry(count: String) {
        enterCount(count)
        addButton().performClick()
    }
    
    fun tapCancel() {
        cancelButton().performClick()
    }
    
    // MARK: - Assertions
    
    fun assertIsVisible() {
        try {
            dialog().assertIsDisplayed()
        } catch (e: Exception) {
            countTextField().assertIsDisplayed()
        }
    }
}
