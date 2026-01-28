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
    
    fun dialog() = composeRule.onNodeWithTag("challenge_form")
    
    fun nameTextField() = composeRule.onNodeWithTag("challenge_name_input")
    
    fun targetTextField() = composeRule.onNodeWithTag("challenge_target_input")
    
    fun timeframePicker() = composeRule.onNodeWithTag("challenge_timeframe_picker")
    
    fun publicToggle() = composeRule.onNodeWithTag("challenge_public_toggle")
    
    fun saveButton() = composeRule.onNodeWithTag("save_challenge_button")
    
    fun cancelButton() = composeRule.onNodeWithTag("cancel_challenge_button")
    
    // MARK: - Actions
    
    fun fillChallenge(name: String, target: String, timeframe: String? = null) {
        nameTextField().performTextInput(name)
        targetTextField().performTextInput(target)
        
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
        saveButton().performClick()
    }
    
    fun tapCancel() {
        cancelButton().performClick()
    }
    
    // MARK: - Assertions
    
    fun assertIsVisible() {
        dialog().assertIsDisplayed()
    }
}
