import XCTest

/// UI test to capture key screenshots for product review
final class ScreenshotFlowTests: TallyUITestCase {
    private let screenshotDirectory = "/Users/cm/work/tally"

    lazy var dashboardPage = DashboardPage(app: app)
    lazy var challengeDialog = ChallengeDialogPage(app: app)
    lazy var challengeDetail = ChallengeDetailPage(app: app)

    override func setUpWithError() throws {
        continueAfterFailure = false
        try super.setUpWithError()
    }

    func testCaptureDashboardChallengeAndAddEntryScreens() throws {
        _ = waitForElement(dashboardPage.createChallengeButton, timeout: 15)

        // Ensure offline mode entry point shows content
        captureScreenshot(named: "sim_screenshot1")

        // Create a challenge
        dashboardPage.tapCreateChallenge()
        challengeDialog.assertIsVisible()
        challengeDialog.fillChallenge(name: "Push-ups", target: "1000")
        challengeDialog.tapSaveAndWaitForDismiss()
        dashboardPage.assertChallengeExists(named: "Push-ups")

        // Open challenge detail
        dashboardPage.tapChallenge(named: "Push-ups")
        challengeDetail.assertTitle(contains: "Push-ups")
        sleep(1)
        captureScreenshot(named: "sim_screenshot2")

        // Add entries to populate recent entries list
        if challengeDetail.addEntryButton.waitForExistence(timeout: 5) {
            challengeDetail.tapAddEntry()
            let entryDialog = EntryDialogPage(app: app)
            entryDialog.assertIsVisible()
            entryDialog.enterCount("5")
            entryDialog.save()
        }

        if challengeDetail.addEntryButton.waitForExistence(timeout: 5) {
            challengeDetail.tapAddEntry()
            let entryDialog = EntryDialogPage(app: app)
            entryDialog.assertIsVisible()
            entryDialog.enterCount("8")
            entryDialog.save()
        }

        if challengeDetail.addEntryButton.waitForExistence(timeout: 5) {
            challengeDetail.tapAddEntry()
            let entryDialog = EntryDialogPage(app: app)
            entryDialog.assertIsVisible()
            entryDialog.enterCount("12")
            entryDialog.save()
        }

        // Capture challenge detail with recent entries
        sleep(1)
        captureScreenshot(named: "sim_screenshot3")

        // Open add entry sheet for screenshot
        if challengeDetail.addEntryButton.waitForExistence(timeout: 5) {
            challengeDetail.tapAddEntry()
            let entryDialog = EntryDialogPage(app: app)
            entryDialog.assertIsVisible()
            sleep(1)
            captureScreenshot(named: "sim_screenshot4")
        }
    }

    private func captureScreenshot(named name: String) {
        let screenshot = XCUIScreen.main.screenshot()
        let screenshotPath = "\(screenshotDirectory)/\(name).png"
        do {
            try screenshot.pngRepresentation.write(to: URL(fileURLWithPath: screenshotPath))
        } catch {
            XCTFail("Failed to save screenshot to \(screenshotPath): \(error)")
        }
    }
}
