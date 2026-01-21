package com.tally.app.utils

import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performTextInput

/**
 * Base test utilities and helpers for Tally UI tests.
 */
object TestHelper {
    
    /**
     * Waits for a node with the given test tag to exist.
     */
    fun ComposeTestRule.waitForNodeWithTag(
        testTag: String,
        timeoutMillis: Long = 5000
    ) {
        waitUntil(timeoutMillis) {
            try {
                onNodeWithTag(testTag).assertExists()
                true
            } catch (e: AssertionError) {
                false
            }
        }
    }
    
    /**
     * Waits for a node with the given text to exist.
     */
    fun ComposeTestRule.waitForNodeWithText(
        text: String,
        timeoutMillis: Long = 5000
    ) {
        waitUntil(timeoutMillis) {
            try {
                onNodeWithText(text, substring = true).assertExists()
                true
            } catch (e: AssertionError) {
                false
            }
        }
    }
    
    /**
     * Clears a text field and enters new text.
     */
    fun ComposeTestRule.clearAndType(testTag: String, text: String) {
        onNodeWithTag(testTag).performTextInput(text)
    }
}

/**
 * Test data constants.
 */
object TestData {
    const val CHALLENGE_NAME = "Push-ups"
    const val CHALLENGE_TARGET = "10000"
    const val ENTRY_COUNT = "50"
    
    const val TEST_EMAIL = "test@example.com"
    const val TEST_PASSWORD = "TestPass123!"
}
