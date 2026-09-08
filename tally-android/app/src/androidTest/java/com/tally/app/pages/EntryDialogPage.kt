package com.tally.app.pages

import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextReplacement
import androidx.compose.ui.test.assertIsDisplayed

/** Page object for the quick-add dialog's current UI contract. */
class EntryDialogPage(private val composeRule: ComposeTestRule) {
    fun dialog() = composeRule.onNodeWithTag("addEntryDialog")
    fun countTextField() = composeRule.onNodeWithTag("countInput")
    fun saveButton() = composeRule.onNodeWithTag("saveButton")
    fun cancelButton() = composeRule.onNodeWithContentDescription("Close")

    fun enterCount(count: String) { countTextField().performTextReplacement(count) }
    fun addEntry(count: String) {
        enterCount(count)
        saveButton().performClick()
    }
    fun tapCancel() { cancelButton().performClick() }
    fun assertIsVisible() { dialog().assertIsDisplayed() }
}
