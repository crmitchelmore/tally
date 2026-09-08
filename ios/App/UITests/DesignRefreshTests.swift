import XCTest

final class DesignRefreshTests: TallyUITestCase {
    func testReadingIdeaCanBeEditedLoggedAndRestored() {
        let dashboard = DashboardPage(app: app)
        waitAndTap(dashboard.createChallengeButton)
        waitAndTap(app.buttons["reading-idea"])
        XCTAssertEqual(app.textFields["challenge-name-input"].value as? String, "Read a little every day")
        XCTAssertEqual(app.textFields["challenge-target-input"].value as? String, "500")
        waitAndTap(app.buttons["save-challenge-button"])

        let log = app.buttons["quick-add"].firstMatch
        waitAndTap(log)
        let count = app.textFields["countInput"].firstMatch
        XCTAssertTrue(count.waitForExistence(timeout: 5))
        // A centre tap can put the insertion point before the default digit.
        count.coordinate(withNormalizedOffset: CGVector(dx: 0.95, dy: 0.5)).tap()
        count.typeText(XCUIKeyboardKey.delete.rawValue + "25")
        XCTAssertEqual(count.value as? String, "25")
        waitAndTap(app.buttons["addEntryNavButton"])

        let progress = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "25 of 500")).firstMatch
        XCTAssertTrue(progress.waitForExistence(timeout: 10), "The dashboard should display the saved entry.")
        app.terminate()
        app.launchArguments = ["--offline-mode"]
        app.launch()
        XCTAssertTrue(progress.waitForExistence(timeout: 10), "Progress must survive relaunch.")
    }
}
