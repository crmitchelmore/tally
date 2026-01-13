import XCTest

/// E2E smoke tests for the iOS app's critical launch journey.
///
/// These tests are intentionally "no-secrets": in CI/local sim runs without
/// `CLERK_PUBLISHABLE_KEY`, we should render the Welcome screen.
final class TallyAppUITests: XCTestCase {

  override func setUp() {
    continueAfterFailure = false
  }

  func testLaunch_showsWelcomeWhenMissingClerkKey() {
    let app = XCUIApplication()
    app.launch()

    XCTAssertTrue(app.navigationBars["Welcome"].waitForExistence(timeout: 10))
    XCTAssertTrue(
      app.staticTexts["Set CLERK_PUBLISHABLE_KEY in the iOS build settings to enable native sign-in."].exists
    )
  }
}
