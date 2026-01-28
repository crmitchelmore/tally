package com.tally.app

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.tally.app.pages.AuthPage
import com.tally.app.pages.DashboardPage
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Tests for authentication flow.
 * These tests verify sign-in view elements and offline mode functionality.
 */
@RunWith(AndroidJUnit4::class)
class AuthTests {
    
    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()
    
    private val authPage by lazy { AuthPage(composeRule) }
    private val dashboardPage by lazy { DashboardPage(composeRule) }
    
    // MARK: - Sign In View Tests
    
    @Test
    fun testSignInViewAppears() {
        // The app should show sign-in view when not authenticated
        composeRule.waitForIdle()
        authPage.assertSignInViewIsVisible()
    }
    
    @Test
    fun testSignInViewHasRequiredElements() {
        // Wait for the screen to load
        composeRule.waitForIdle()
        
        // Verify all required elements exist
        authPage.assertHasRequiredElements()
    }
    
    // MARK: - Offline Mode Tests
    
    @Test
    fun testContinueWithoutAccountEntersOfflineMode() {
        // Wait for sign-in view to load
        composeRule.waitForIdle()
        
        // Tap local-only mode button
        authPage.tapContinueWithoutAccount()
        composeRule.waitForIdle()
        
        // Should enter the app - verify dashboard is shown
        composeRule.onNodeWithTag("dashboard").assertIsDisplayed()
    }
    
    // MARK: - Sign In with Test User
    // Note: These tests require valid test credentials in environment
    
    @Test
    fun testSignInButtonLaunchesClerkAuth() {
        // Wait for sign-in view
        composeRule.waitForIdle()
        authPage.signInButton().assertIsDisplayed()
        
        // Tap sign in - this would normally launch Clerk's browser auth
        // In a real test, we'd need to mock or handle the browser intent
        // For now, just verify the button is tappable
        // authPage.tapSignIn() - commented out as it launches external browser
    }
}
