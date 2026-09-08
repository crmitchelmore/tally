import XCTest

/// Reproducible store assets, captured from the actual app with fictional local goals.
final class StoreScreenshotTests: TallyUITestCase {
    func testCaptureStoreScreens() {
        let dashboard = DashboardPage(app: app)
        let form = ChallengeDialogPage(app: app)
        waitAndTap(dashboard.createChallengeButton)
        form.fillChallenge(name: "Read a little every day", target: "500")
        form.tapSaveAndWaitForDismiss()
        waitAndTap(app.buttons["quick-add"].firstMatch)
        let entry = EntryDialogPage(app: app)
        entry.enterCount("25")
        entry.save()
        XCTAssertTrue(app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "25 of 500")).firstMatch.waitForExistence(timeout: 10))
        capture("01-progress")
        dashboard.tapChallenge(named: "Read a little every day")
        let detail = ChallengeDetailPage(app: app)
        detail.assertTitle(contains: "Read a little every day")
        capture("02-goal")
        waitAndTap(detail.addEntryButton)
        entry.assertIsVisible()
        capture("03-add-entry")
    }
    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
