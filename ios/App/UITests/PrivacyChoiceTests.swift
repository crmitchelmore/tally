import XCTest
final class PrivacyChoiceTests: XCTestCase {
    func testDecliningIsPersistentAndDoesNotPreventUse() {
        let app = XCUIApplication()
        app.launchArguments = ["--uitesting", "--privacy-testing", "--offline-mode"]
        app.launch()
        XCTAssertTrue(app.buttons["privacy_decline"].waitForExistence(timeout: 20))
        XCTAssertEqual(app.switches["privacy_analytics"].value as? String, "0")
        XCTAssertEqual(app.switches["privacy_diagnostics"].value as? String, "0")
        app.buttons["privacy_decline"].tap()
        XCTAssertFalse(app.buttons["privacy_decline"].exists)
        app.terminate()
        app.launchArguments = ["--offline-mode"]
        app.launch()
        XCTAssertTrue(app.buttons["create-challenge-button"].waitForExistence(timeout: 15))
        XCTAssertFalse(app.buttons["privacy_decline"].exists)
    }
}
