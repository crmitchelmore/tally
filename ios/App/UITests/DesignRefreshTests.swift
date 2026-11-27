import XCTest

final class DesignRefreshTests: TallyUITestCase {
    func testReadingIdeaCanBeEditedLoggedAndRestored() {
        let dashboard = DashboardPage(app: app)
        waitAndTap(dashboard.createChallengeButton)
        waitAndTap(app.buttons["reading-idea"])
        XCTAssertEqual(app.textFields["challenge-name-input"].value as? String, "Read a little every day")
        XCTAssertEqual(app.textFields["challenge-target-input"].value as? String, "500")
        waitAndTap(app.buttons["save-challenge-button"])

        let log = dashboard.quickAddButton(forChallenge: "Read a little every day")
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

extension DesignRefreshTests {
    func testTallyAndDraftSurviveRotationAndRelaunch() {
        defer { XCUIDevice.shared.orientation = .portrait }
        let name = "Read a little every day"
        let dashboard = DashboardPage(app: app)
        waitAndTap(dashboard.createChallengeButton)
        waitAndTap(app.buttons["reading-idea"])
        waitAndTap(app.buttons["save-challenge-button"])

        let increment = app.buttons["increment-\(name)"]
        XCTAssertTrue(increment.waitForExistence(timeout: 5))
        for _ in 0..<3 {
            increment.tap()
        }
        let row = app.buttons["open-challenge-\(name)"]
        assertLabel(row, contains: "3 of 500")
        let actions = dashboard.challengeCard(named: name).buttons.allElementsBoundByIndex.map(\.identifier)
        XCTAssertEqual(actions, ["open-challenge-\(name)", "increment-\(name)", "quick-add"])
        XCTAssertGreaterThanOrEqual(increment.frame.height, 44)
        captureLayout("challenge-list-portrait")

        waitAndTap(row)
        let total = app.staticTexts["challenge-total-count"]
        assertLabel(total, equals: "3")
        XCUIDevice.shared.orientation = .landscapeLeft
        assertLabel(total, equals: "3")
        captureLayout("challenge-detail-landscape")

        waitAndTap(app.buttons["detail-add-entry"])
        let count = app.textFields["countInput"].firstMatch
        clearAndType(count, text: "25")
        XCUIDevice.shared.orientation = .portrait
        XCTAssertTrue(count.waitForExistence(timeout: 5))
        XCTAssertEqual(count.value as? String, "25")
        count.typeText(XCUIKeyboardKey.delete.rawValue + "6")
        XCTAssertEqual(count.value as? String, "26", "The count field should keep focus during resize.")
        captureLayout("draft-after-rotation")
        waitAndTap(app.buttons["addEntryNavButton"])
        assertLabel(total, equals: "29")

        let history = app.staticTexts["Entry History"]
        for _ in 0..<7 where !history.isHittable {
            app.swipeUp()
        }
        XCTAssertTrue(history.isHittable)
        XCUIDevice.shared.orientation = .landscapeRight
        XCTAssertTrue(app.buttons["detail-add-entry"].isHittable)
        XCTAssertTrue(history.exists)
        XCUIDevice.shared.orientation = .portrait

        let edit = app.buttons.matching(identifier: "Edit entry").firstMatch
        for _ in 0..<4 where !edit.isHittable {
            app.swipeUp()
        }
        waitAndTap(edit)
        let editCount = app.textFields["countInput"].firstMatch
        clearAndType(editCount, text: "42")
        XCUIDevice.shared.orientation = .landscapeLeft
        XCTAssertEqual(editCount.value as? String, "42")
        waitAndTap(app.navigationBars["Edit Entry"].buttons["Cancel"])
        XCUIDevice.shared.orientation = .portrait

        app.terminate()
        app.launchArguments = ["--uitesting", "--offline-mode"]
        app.launch()
        assertLabel(row, contains: "29 of 500")
    }

    func testSettingsSurvivesRotationWithoutTipping() {
        defer { XCUIDevice.shared.orientation = .portrait }
        waitAndTap(app.buttons["Profile"].firstMatch)
        XCTAssertTrue(app.navigationBars["Settings"].waitForExistence(timeout: 5))
        XCUIDevice.shared.orientation = .landscapeLeft
        XCTAssertTrue(app.navigationBars["Settings"].exists)
        XCTAssertFalse(app.staticTexts["Support Development"].exists)
        waitAndTap(app.navigationBars["Settings"].buttons["Done"])
        XCTAssertTrue(app.buttons["Profile"].firstMatch.isHittable)
    }

    private func assertLabel(_ element: XCUIElement, contains value: String) {
        waitForLabel(element, matching: NSPredicate(format: "label CONTAINS %@", value))
    }

    private func assertLabel(_ element: XCUIElement, equals value: String) {
        waitForLabel(element, matching: NSPredicate(format: "label == %@", value))
    }

    private func waitForLabel(_ element: XCUIElement, matching predicate: NSPredicate) {
        XCTAssertTrue(element.waitForExistence(timeout: 8))
        let label = XCTNSPredicateExpectation(predicate: predicate, object: element)
        XCTAssertEqual(XCTWaiter.wait(for: [label], timeout: 5), .completed,
                       "Expected \(predicate.predicateFormat). Actual label: \(element.label)")
    }

    private func captureLayout(_ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
