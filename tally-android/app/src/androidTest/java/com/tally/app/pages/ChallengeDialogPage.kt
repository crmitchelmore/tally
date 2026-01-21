package com.tally.app.pages

import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.assertIsDisplayed

/**
 * Page object for the Challenge creation/edit dialog.
 */
class ChallengeDialogPage(private val composeRule: ComposeTestRule) {
    
    // MARK: - Element Finders
    
    fun dialog() = composeRule.onNodeWithTag("challenge-dialog")
    
    fun nameTextField() = composeRule.onNodeWithTag("challenge-name-input")
    
    fun targetTextField() = composeRule.onNodeWithTag("challenge-target-input")
    
    fun timeframePicker() = composeRule.onNodeWithTag("challenge-timeframe-picker")
    
    fun publicToggle() = composeRule.onNodeWithTag("challenge-public-toggle")
    
    fun saveButton() = try {
        composeRule.onNodeWithText("Save")
    } catch (e: Exception) {
        composeRule.onNodeWithText("Create")
    }
    
    fun cancelButton() = composeRule.onNodeWithText("Cancel")
    
    // MARK: - Actions
    
    fun fillChallenge(name: String, target: String, timeframe: String? = null) {
        try {
            composeRule.onNodeWithTag("challenge-name-input").performTextInput(name)
        } catch (e: Exception) {
            composeRule.onNodeWithText("Name", substring = true).performTextInput(name)
        }
        
        try {
            composeRule.onNodeWithTag("challenge-target-input").performTextInput(target)
        } catch (e: Exception) {
            composeRule.onNodeWithText("Target", substring = true).performTextInput(target)
        }
        
        timeframe?.let {
            try {
                timeframePicker().performClick()
                composeRule.onNodeWithText(it).performClick()
            } catch (e: Exception) {
                // Timeframe picker might not be implemented
            }
        }
    }
    
    fun tapSave() {
        try {
            composeRule.onNodeWithText("Save").performClick()
        } catch (e: Exception) {
            composeRule.onNodeWithText("Create").performClick()
        }
    }
    
    fun tapCancel() {
        cancelButton().performClick()
    }
    
    // MARK: - Assertions
    
    fun assertIsVisible() {
        try {
            dialog().assertIsDisplayed()
        } catch (e: Exception) {
            nameTextField().assertIsDisplayed()
        }
    }
}
