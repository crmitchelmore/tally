import XCTest

/// Tests for entry logging features
/// Maps to cucumber/04-entry-logging.feature
final class EntryTests: TallyUITestCase {
    
    lazy var dashboardPage = DashboardPage(app: app)
    lazy var challengeDialog = ChallengeDialogPage(app: app)
    lazy var challengeDetail = ChallengeDetailPage(app: app)
    lazy var entryDialog = EntryDialogPage(app: app)
    
    // MARK: - Setup
    
    private func createTestChallenge(name: String = "Entry Test") {
        _ = waitForElement(dashboardPage.createChallengeButton)
        dashboardPage.tapCreateChallenge()
        challengeDialog.fillChallenge(name: name, target: "10000")
        challengeDialog.tapSaveAndWaitForDismiss()
        dashboardPage.assertChallengeExists(named: name)
    }
    
    // MARK: - Adding Basic Entries
    
    func testAddSimpleEntryToChallenge() throws {
        createTestChallenge(name: "Push-ups")
        
        // Open challenge detail
        dashboardPage.tapChallenge(named: "Push-ups")
        
        // Add entry
        if challengeDetail.addEntryButton.waitForExistence(timeout: 5) {
            challengeDetail.tapAddEntry()
            
            entryDialog.assertIsVisible()
            entryDialog.addEntry(count: TestData.entryCount)
            
            // Verify progress updated
            XCTAssertTrue(staticText(containing: "50").waitForExistence(timeout: 5))
        }
    }
    
    func testAddEntryFromDashboardQuickAction() throws {
        createTestChallenge(name: "Quick Add")
        
        // Use quick add button if available
        let quickAdd = dashboardPage.quickAddButton(forChallenge: "Quick Add")
        
        if quickAdd.waitForExistence(timeout: 3) {
            quickAdd.tap()
            
            entryDialog.assertIsVisible()
            entryDialog.addEntry(count: "25")
            
            // Progress should update
            XCTAssertTrue(staticText(containing: "25").waitForExistence(timeout: 5))
        } else {
            // Quick add not implemented, skip
            throw XCTSkip("Quick add button not implemented")
        }
    }
    
    // MARK: - Entry Feedback
    
    func testSuccessFeedbackOnEntry() throws {
        createTestChallenge(name: "Feedback Test")
        
        dashboardPage.tapChallenge(named: "Feedback Test")
        
        if challengeDetail.addEntryButton.waitForExistence(timeout: 5) {
            challengeDetail.tapAddEntry()
            entryDialog.addEntry(count: "5")
            
            // Entry should be recorded (verify by checking progress)
            XCTAssertTrue(staticText(containing: "5").waitForExistence(timeout: 5))
        }
    }
    
    // MARK: - Multiple Entries
    
    func testAddMultipleEntriesOnSameDay() throws {
        createTestChallenge(name: "Multiple Entries")
        
        dashboardPage.tapChallenge(named: "Multiple Entries")
        
        if challengeDetail.addEntryButton.waitForExistence(timeout: 5) {
            // Add first entry
            challengeDetail.tapAddEntry()
            entryDialog.addEntry(count: "30")
            
            // Wait and add second entry
            sleep(1)
            
            if challengeDetail.addEntryButton.waitForExistence(timeout: 5) {
                challengeDetail.tapAddEntry()
                entryDialog.addEntry(count: "25")
            }
            
            // Total should be 55
            XCTAssertTrue(staticText(containing: "55").waitForExistence(timeout: 5))
        }
    }
}
