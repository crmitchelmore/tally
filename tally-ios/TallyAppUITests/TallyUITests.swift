import XCTest

final class TallyUITests: XCTestCase {

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    override func tearDownWithError() throws {
    }

    @MainActor
    func testAppLaunches() throws {
        let app = XCUIApplication()
        app.launch()
        
        // Basic launch test - verify app starts without crashing
        XCTAssertTrue(app.wait(for: .runningForeground, timeout: 10))
    }
}
