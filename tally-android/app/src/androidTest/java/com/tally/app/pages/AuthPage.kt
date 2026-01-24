package com.tally.app.pages

import androidx.compose.ui.test.junit4.ComposeTestRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.assertIsDisplayed

/**
 * Page object for the Sign-in screen.
 */
class AuthPage(private val composeRule: ComposeTestRule) {
    
    // MARK: - Element Finders
    
    fun signInButton() = composeRule.onNodeWithText("Sign in")
    
    fun continueWithoutAccountButton() = composeRule.onNodeWithText("Continue without account")
    
    fun tallyLogo() = composeRule.onNodeWithContentDescription("Tally app logo")
    
    fun appTitle() = composeRule.onNodeWithText("Tally")
    
    fun tagline() = composeRule.onNodeWithText("Track what matters")
    
    fun offlineModeNote() = composeRule.onNodeWithText("Your data stays on this device in offline mode.")
    
    // MARK: - Actions
    
    fun tapSignIn() {
        signInButton().performClick()
    }
    
    fun tapContinueWithoutAccount() {
        continueWithoutAccountButton().performClick()
    }
    
    // MARK: - Assertions
    
    fun assertSignInViewIsVisible() {
        appTitle().assertIsDisplayed()
        signInButton().assertIsDisplayed()
    }
    
    fun assertHasRequiredElements() {
        tallyLogo().assertIsDisplayed()
        appTitle().assertIsDisplayed()
        tagline().assertIsDisplayed()
        signInButton().assertIsDisplayed()
        continueWithoutAccountButton().assertIsDisplayed()
        offlineModeNote().assertIsDisplayed()
    }
    
    fun assertIsSignedOut() {
        signInButton().assertIsDisplayed()
    }
}
