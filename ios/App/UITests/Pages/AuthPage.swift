import XCTest

/// Page object for authentication screens
class AuthPage {
    let app: XCUIApplication
    
    init(app: XCUIApplication) {
        self.app = app
    }
    
    // MARK: - Sign In View Elements
    
    var signInButton: XCUIElement {
        app.buttons["Sign in"]
    }
    
    var continueWithoutAccountButton: XCUIElement {
        app.buttons["Continue without account"]
    }
    
    var tallyLogo: XCUIElement {
        app.staticTexts["Tally"]
    }
    
    var tagline: XCUIElement {
        app.staticTexts["Track what matters"]
    }
    
    // MARK: - Clerk Auth Sheet Elements (when shown)
    
    var emailTextField: XCUIElement {
        // Clerk's email field in the auth sheet
        app.textFields.firstMatch
    }
    
    var passwordTextField: XCUIElement {
        // Clerk's password field
        app.secureTextFields.firstMatch
    }
    
    var continueButton: XCUIElement {
        app.buttons["Continue"]
    }
    
    // MARK: - Actions
    
    func tapSignIn() {
        signInButton.tap()
    }
    
    func tapContinueWithoutAccount() {
        continueWithoutAccountButton.tap()
    }
    
    func enterEmail(_ email: String) {
        guard emailTextField.waitForExistence(timeout: 5) else {
            XCTFail("Email field not found")
            return
        }
        emailTextField.tap()
        emailTextField.typeText(email)
    }
    
    func enterPassword(_ password: String) {
        guard passwordTextField.waitForExistence(timeout: 5) else {
            XCTFail("Password field not found")
            return
        }
        passwordTextField.tap()
        passwordTextField.typeText(password)
    }
    
    func tapContinue() {
        continueButton.tap()
    }
    
    // MARK: - Assertions
    
    func assertSignInViewIsVisible() {
        XCTAssertTrue(
            tallyLogo.waitForExistence(timeout: 10),
            "Tally logo should be visible on sign in screen"
        )
        XCTAssertTrue(signInButton.exists, "Sign in button should be visible")
    }
    
    func assertIsSignedOut() {
        // Verify we're on the sign in screen
        XCTAssertTrue(
            signInButton.waitForExistence(timeout: 10),
            "Should see sign in button when signed out"
        )
    }
}
