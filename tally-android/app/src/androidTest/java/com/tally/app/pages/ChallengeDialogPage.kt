package com.tally.app.pages

import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.hasTestTag

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
        composeRule.waitForIdle()
        Thread.sleep(200)
        
        if (name.isNotEmpty()) {
            // Click to focus, then replace text
            nameTextField().performClick()
            composeRule.waitForIdle()
            nameTextField().performTextReplacement(name)
            composeRule.waitForIdle()
            Thread.sleep(150)
        }
        if (target.isNotEmpty()) {
            // Click to focus, then replace text
            targetTextField().performClick()
            composeRule.waitForIdle()
            targetTextField().performTextReplacement(target)
            composeRule.waitForIdle()
            Thread.sleep(150)
        }
        
        // Select timeframe via segmented buttons (not a picker)
        timeframe?.let {
            try {
                composeRule.onNodeWithText(it).performClick()
                composeRule.waitForIdle()
            } catch (e: Exception) {
                // Timeframe button might not be visible or already selected
            }
        }
        
        // Wait for UI to settle
        Thread.sleep(200)
        composeRule.waitForIdle()
    }
    
    fun tapSave() {
        composeRule.waitForIdle()
        Thread.sleep(300) // Give text input time to register
        
        // Try clicking the Create button directly by text first (more reliable)
        try {
            composeRule.onNodeWithText("Create").performClick()
            composeRule.waitForIdle()
            Thread.sleep(500)
            return
        } catch (e: Exception) {
            // Fall through to testTag approach
        }
        
        // Try by testTag
        try {
            val buttonExists = composeRule
                .onAllNodes(hasTestTag("save_challenge_button"))
                .fetchSemanticsNodes()
                .isNotEmpty()
            
            if (buttonExists) {
                saveButton().performClick()
            }
        } catch (e: Exception) {
            // Last resort - try "Save" text
            composeRule.onNodeWithText("Save").performClick()
        }
        composeRule.waitForIdle()
        Thread.sleep(500) // Give save time to complete
    }
    
    fun tapCancel() {
        cancelButton().performClick()
    }
    
    // MARK: - Assertions
    
    fun assertIsVisible() {
        dialog().assertIsDisplayed()
    }
}
