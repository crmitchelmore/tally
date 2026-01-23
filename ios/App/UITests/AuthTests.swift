import XCTest

/// Tests for authentication flow
/// These tests verify sign-in with test user credentials
final class AuthTests: TallyUITestCase {
    
    lazy var authPage = AuthPage(app: app)
    lazy var dashboardPage = DashboardPage(app: app)
    
    // MARK: - Sign In View
    
    func testSignInViewAppears() throws {
        // The app should show sign-in view when not authenticated
        authPage.assertSignInViewIsVisible()
    }
    
    func testSignInViewHasRequiredElements() throws {
        // Wait for sign in view to load
        XCTAssertTrue(
            authPage.signInButton.waitForExistence(timeout: 10),
            "Sign in button should exist"
        )
        
        // Check all elements
        XCTAssertTrue(authPage.tallyLogo.exists, "Tally logo should be visible")
        XCTAssertTrue(authPage.tagline.exists, "Tagline should be visible")
        XCTAssertTrue(authPage.continueWithoutAccountButton.exists, "Offline mode button should exist")
    }
    
    // MARK: - Offline Mode
    
    func testContinueWithoutAccountEntersOfflineMode() throws {
        // Wait for sign in view
        XCTAssertTrue(
            authPage.continueWithoutAccountButton.waitForExistence(timeout: 10),
            "Offline mode button should exist"
        )
        
        // Tap to enter offline mode
        authPage.tapContinueWithoutAccount()
        
        // Should see dashboard - look for any of these indicators:
        // 1. The empty state with "No challenges yet" text
        // 2. The Create Challenge button
        // 3. The toolbar plus button
        // 4. The "Home" tab bar label
        let noChallengText = app.staticTexts["No challenges yet"].waitForExistence(timeout: 10)
        let createButton = dashboardPage.createChallengeButton.waitForExistence(timeout: 5)
        let plusButton = app.buttons.matching(NSPredicate(format: "label CONTAINS 'plus' OR identifier CONTAINS 'plus'")).firstMatch.waitForExistence(timeout: 5)
        let homeTab = app.staticTexts["Home"].waitForExistence(timeout: 5)
        
        let enteredApp = noChallengText || createButton || plusButton || homeTab
        
        XCTAssertTrue(enteredApp, "Should enter app in offline mode (found: noChallenge=\(noChallengText), createBtn=\(createButton), plus=\(plusButton), home=\(homeTab))")
    }
    
    // MARK: - Sign In with Test User
    // Note: These tests require valid test credentials in environment
    
    func testSignInWithTestUser() throws {
        // Get test credentials from environment
        guard let email = ProcessInfo.processInfo.environment["TEST_USER_EMAIL"],
              let password = ProcessInfo.processInfo.environment["TEST_USER_PASSWORD"] else {
            throw XCTSkip("TEST_USER_EMAIL and TEST_USER_PASSWORD not set")
        }
        
        // Wait for sign in view
        XCTAssertTrue(
            authPage.signInButton.waitForExistence(timeout: 10),
            "Sign in button should exist"
        )
        
        // Open Clerk auth sheet
        authPage.tapSignIn()
        
        // Wait for Clerk UI to load
        sleep(2)
        
        // Note: Clerk's UI may vary. This attempts to interact with email/password flow
        // In practice, Clerk may show OAuth buttons first
        
        // If we see a web view or OAuth prompt, this test needs adjustment
        let clerkSheetAppeared = authPage.emailTextField.waitForExistence(timeout: 10)
        
        if !clerkSheetAppeared {
            // Clerk might show OAuth buttons - look for "Continue with email" or similar
            let emailSignInOption = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'email'")).firstMatch
            if emailSignInOption.waitForExistence(timeout: 5) {
                emailSignInOption.tap()
                sleep(1)
            } else {
                throw XCTSkip("Could not find email sign-in option in Clerk UI")
            }
        }
        
        // Enter credentials
        authPage.enterEmail(email)
        authPage.tapContinue()
        
        // Wait for password prompt
        sleep(2)
        authPage.enterPassword(password)
        authPage.tapContinue()
        
        // Wait for auth to complete and dashboard to appear
        let signedIn = dashboardPage.createChallengeButton.waitForExistence(timeout: 15) ||
                      dashboardPage.emptyState.waitForExistence(timeout: 15)
        
        XCTAssertTrue(signedIn, "Should be signed in and see dashboard")
    }
}
