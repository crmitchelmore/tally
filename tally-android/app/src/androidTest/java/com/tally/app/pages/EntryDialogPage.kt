package com.tally.app.pages

import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.assertIsDisplayed

/**
 * Page object for the Entry input dialog.
 * Note: Android currently opens entry dialog directly from challenge card click.
 */
class EntryDialogPage(private val composeRule: ComposeTestRule) {
    
    // MARK: - Element Finders
    
    fun dialog() = composeRule.onNodeWithTag("entry_dialog")
    
    fun countTextField() = composeRule.onNodeWithTag("entry_count_input")
    
    fun saveButton() = composeRule.onNodeWithTag("entry_save_button")
    
    fun cancelButton() = composeRule.onNodeWithText("Cancel")
    
    // MARK: - Actions
    
    fun enterCount(count: String) {
        try {
            countTextField().performTextInput(count)
        } catch (e: Exception) {
            // Try finding by label
            composeRule.onNodeWithText("Count", substring = true).performTextInput(count)
        }
    }
    
    fun addEntry(count: String) {
        enterCount(count)
        saveButton().performClick()
    }
    
    fun tapCancel() {
        cancelButton().performClick()
    }
    
    // MARK: - Assertions
    
    fun assertIsVisible() {
        // First try testTag
        try {
            dialog().assertIsDisplayed()
            return
        } catch (e: Exception) {
            // Continue to fallback
        }
        
        // Try finding "Add to" title text
        try {
            composeRule.onNodeWithText("Add to", substring = true).assertIsDisplayed()
            return  
        } catch (e: Exception) {
            // Continue to fallback
        }
        
        // Try finding the Save button  
        composeRule.onNodeWithText("Save").assertIsDisplayed()
    }
}
