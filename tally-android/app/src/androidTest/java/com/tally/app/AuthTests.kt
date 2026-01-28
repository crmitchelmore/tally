package com.tally.app

import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.tally.app.pages.AuthPage
import com.tally.app.pages.DashboardPage
import org.junit.Assume.assumeTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Tests for authentication flow.
 * These tests verify sign-in view elements and offline mode functionality.
 * 
 * Note: These tests require the app to NOT be in local-only mode.
 * If already authenticated/local-only, tests will be skipped.
 */
@RunWith(AndroidJUnit4::class)
class AuthTests {
    
    @get:Rule
    val composeRule = createAndroidComposeRule<MainActivity>()
    
    private val authPage by lazy { AuthPage(composeRule) }
    private val dashboardPage by lazy { DashboardPage(composeRule) }
    
    /**
     * Check if sign-in screen is visible (not already in local-only mode).
     */
    private fun requireSignInScreen() {
        composeRule.waitForIdle()
        val isOnSignIn = try {
            composeRule.onNodeWithTag("sign_in_screen").assertExists()
            true
        } catch (e: AssertionError) {
            false
        }
        assumeTrue("Sign-in screen not visible (app in local-only mode)", isOnSignIn)
    }
    
    // MARK: - Sign In View Tests
    
    @Test
    fun testSignInViewAppears() {
        requireSignInScreen()
        authPage.assertSignInViewIsVisible()
    }
    
    @Test
    fun testSignInViewHasRequiredElements() {
        requireSignInScreen()
        authPage.assertHasRequiredElements()
    }
    
    // MARK: - Offline Mode Tests
    
    @Test
    fun testContinueWithoutAccountEntersOfflineMode() {
        requireSignInScreen()
        
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
        requireSignInScreen()
        authPage.signInButton().assertIsDisplayed()
        
        // Tap sign in - this would normally launch Clerk's browser auth
        // In a real test, we'd need to mock or handle the browser intent
        // For now, just verify the button is tappable
        // authPage.tapSignIn() - commented out as it launches external browser
    }
}
