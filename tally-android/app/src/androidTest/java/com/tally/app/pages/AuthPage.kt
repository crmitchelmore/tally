package com.tally.app.pages

import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.assertIsDisplayed

/**
 * Page object for the Sign-in screen.
 */
class AuthPage(private val composeRule: ComposeTestRule) {
    
    // MARK: - Element Finders
    
    fun signInScreen() = composeRule.onNodeWithTag("sign_in_screen")
    
    fun signInButton() = composeRule.onNodeWithTag("sign_in_button")
    
    fun continueWithoutAccountButton() = composeRule.onNodeWithTag("continue_without_account_button")
    
    fun tallyLogo() = composeRule.onNodeWithContentDescription("Tally app logo")
    
    fun appTitle() = composeRule.onNodeWithTag("app_title")
    
    fun tagline() = composeRule.onNodeWithTag("app_tagline")
    
    fun localOnlyModeNote() = composeRule.onNodeWithText("Your data stays on this device in local-only mode.", substring = true)
    
    // MARK: - Actions
    
    fun tapSignIn() {
        signInButton().performClick()
    }
    
    fun tapContinueWithoutAccount() {
        continueWithoutAccountButton().performClick()
    }
    
    // MARK: - Assertions
    
    fun assertSignInViewIsVisible() {
        signInScreen().assertIsDisplayed()
    }
    
    fun assertHasRequiredElements() {
        tallyLogo().assertIsDisplayed()
        appTitle().assertIsDisplayed()
        tagline().assertIsDisplayed()
        signInButton().assertIsDisplayed()
        continueWithoutAccountButton().assertIsDisplayed()
    }
    
    fun assertIsSignedOut() {
        signInButton().assertIsDisplayed()
    }
}
