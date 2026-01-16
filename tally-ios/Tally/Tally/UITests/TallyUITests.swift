import XCTest

final class TallyUITests: XCTestCase {
    let app = XCUIApplication()
    
    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app.terminate()
    }
    
    // MARK: - Welcome Screen Tests
    
    func testWelcomeScreenAppears() throws {
        // Check welcome screen elements
        XCTAssertTrue(app.staticTexts["Tally"].exists || app.staticTexts["Welcome"].exists)
    }
    
    func testSignInButtonExists() throws {
        // Wait for the welcome screen to load
        let signInButton = app.buttons["Sign In"]
        XCTAssertTrue(signInButton.waitForExistence(timeout: 5))
    }
    
    func testSignUpButtonExists() throws {
        let signUpButton = app.buttons["Sign Up"]
        XCTAssertTrue(signUpButton.waitForExistence(timeout: 5))
    }
    
    // MARK: - Sign In Flow Tests
    
    func testSignInViewOpens() throws {
        let signInButton = app.buttons["Sign In"]
        XCTAssertTrue(signInButton.waitForExistence(timeout: 5))
        signInButton.tap()
        
        // Check sign in form appears
        let emailField = app.textFields["Email"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 3))
    }
    
    func testGoogleSignInButtonExists() throws {
        let signInButton = app.buttons["Sign In"]
        XCTAssertTrue(signInButton.waitForExistence(timeout: 5))
        signInButton.tap()
        
        // Check Google button
        let googleButton = app.buttons["Continue with Google"]
        XCTAssertTrue(googleButton.waitForExistence(timeout: 3))
    }
    
    func testSignInFormValidation() throws {
        let signInButton = app.buttons["Sign In"]
        XCTAssertTrue(signInButton.waitForExistence(timeout: 5))
        signInButton.tap()
        
        // Email field
        let emailField = app.textFields["Email"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 3))
        
        // Password field
        let passwordField = app.secureTextFields["Password"]
        XCTAssertTrue(passwordField.waitForExistence(timeout: 3))
        
        // Enter valid email
        emailField.tap()
        emailField.typeText("test@example.com")
        
        // Enter password
        passwordField.tap()
        passwordField.typeText("password123")
        
        // Submit button should now be enabled (we'll verify the form accepts input)
        let formSignInButton = app.buttons.matching(identifier: "Sign In").element(boundBy: 1)
        XCTAssertTrue(formSignInButton.exists)
    }
    
    // MARK: - Sign Up Flow Tests
    
    func testSignUpViewOpens() throws {
        let signUpButton = app.buttons["Sign Up"]
        XCTAssertTrue(signUpButton.waitForExistence(timeout: 5))
        signUpButton.tap()
        
        // Check sign up form appears
        let emailField = app.textFields["Email"]
        XCTAssertTrue(emailField.waitForExistence(timeout: 3))
    }
    
    // MARK: - Navigation Tests
    
    func testCancelSignInReturnsToWelcome() throws {
        let signInButton = app.buttons["Sign In"]
        XCTAssertTrue(signInButton.waitForExistence(timeout: 5))
        signInButton.tap()
        
        // Cancel
        let cancelButton = app.buttons["Cancel"]
        XCTAssertTrue(cancelButton.waitForExistence(timeout: 3))
        cancelButton.tap()
        
        // Back to welcome
        XCTAssertTrue(signInButton.waitForExistence(timeout: 3))
    }
}
