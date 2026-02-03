import XCTest

/// Tests for challenge management features
/// Maps to cucumber/03-challenge-management.feature
final class ChallengeTests: TallyUITestCase {
    
    lazy var dashboardPage = DashboardPage(app: app)
    lazy var challengeDialog = ChallengeDialogPage(app: app)
    lazy var challengeDetail = ChallengeDetailPage(app: app)
    
    // MARK: - Creating Challenges
    
    func testCreateYearlyChallengeWithMinimalInput() throws {
        // Given I am on my dashboard
        _ = waitForElement(dashboardPage.createChallengeButton)
        
        // When I tap create challenge
        dashboardPage.tapCreateChallenge()
        
        // Then I should see the challenge creation dialog
        challengeDialog.assertIsVisible()
        
        // When I create a challenge with minimal input
        challengeDialog.fillChallenge(
            name: TestData.challengeName,
            target: TestData.challengeTarget,
            timeframe: "Year"
        )
        challengeDialog.tapSaveAndWaitForDismiss()
        
        // Then I should see the challenge on my dashboard
        dashboardPage.assertChallengeExists(named: TestData.challengeName)
    }
    
    func testCreateMonthlyChallenge() throws {
        _ = waitForElement(dashboardPage.createChallengeButton)
        
        dashboardPage.tapCreateChallenge()
        challengeDialog.assertIsVisible()
        
        challengeDialog.fillChallenge(
            name: "Reading",
            target: "4",
            timeframe: "Month"
        )
        challengeDialog.tapSaveAndWaitForDismiss()
        
        dashboardPage.assertChallengeExists(named: "Reading")
    }
    
    // MARK: - Challenge Lifecycle
    
    func testEditExistingChallenge() throws {
        // First create a challenge
        _ = waitForElement(dashboardPage.createChallengeButton)
        dashboardPage.tapCreateChallenge()
        challengeDialog.fillChallenge(name: "Edit Test", target: "1000")
        challengeDialog.tapSaveAndWaitForDismiss()
        dashboardPage.assertChallengeExists(named: "Edit Test")
        
        // Tap to view detail
        dashboardPage.tapChallenge(named: "Edit Test")
        
        // Edit the challenge
        if challengeDetail.actionsMenu.waitForExistence(timeout: 5) {
            challengeDetail.tapEdit()
            
            // Change target
            if challengeDialog.targetTextField.waitForExistence(timeout: 5) {
                clearAndType(challengeDialog.targetTextField, text: "1500")
                challengeDialog.tapSaveAndWaitForDismiss()
            }
        }
        
        // Verify the update on dashboard card
        challengeDetail.tapBack()
        let card = dashboardPage.challengeCard(named: "Edit Test")
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        let predicate = NSPredicate(format: "label CONTAINS[c] %@", "1500")
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: card)
        XCTAssertEqual(XCTWaiter.wait(for: [expectation], timeout: 10), .completed)
    }
    
    func testDeleteChallengeWithConfirmation() throws {
        // Create a challenge to delete
        _ = waitForElement(dashboardPage.createChallengeButton)
        dashboardPage.tapCreateChallenge()
        challengeDialog.fillChallenge(name: "Delete Test", target: "100")
        challengeDialog.tapSaveAndWaitForDismiss()
        dashboardPage.assertChallengeExists(named: "Delete Test")
        
        // Open detail
        dashboardPage.tapChallenge(named: "Delete Test")
        
        // Delete
        if challengeDetail.deleteButton.waitForExistence(timeout: 5) {
            challengeDetail.tapDelete()
            
            // Confirm deletion
            let confirmButton = app.buttons["Delete"].firstMatch
            if confirmButton.waitForExistence(timeout: 3) {
                confirmButton.tap()
            }
            
            // Verify deleted
            dashboardPage.assertChallengeNotExists(named: "Delete Test")
        }
    }
    
    // MARK: - Dashboard View
    
    func testViewChallengeInformationOnDashboard() throws {
        // Create a challenge
        _ = waitForElement(dashboardPage.createChallengeButton)
        dashboardPage.tapCreateChallenge()
        challengeDialog.fillChallenge(name: "Dashboard Test", target: "5000")
        challengeDialog.tapSaveAndWaitForDismiss()
        
        let card = dashboardPage.challengeCard(named: "Dashboard Test")
        XCTAssertTrue(card.waitForExistence(timeout: 5))
        
        // Should display name
        XCTAssertTrue(staticText(containing: "Dashboard Test").exists)
        
        // Should display progress
        XCTAssertTrue(staticText(containing: "0").exists || staticText(containing: "5000").exists)
    }
    
    // MARK: - Challenge Detail
    
    func testViewChallengeDetail() throws {
        // Create a challenge
        _ = waitForElement(dashboardPage.createChallengeButton)
        dashboardPage.tapCreateChallenge()
        challengeDialog.fillChallenge(name: "Detail Test", target: "10000")
        challengeDialog.tapSaveAndWaitForDismiss()
        dashboardPage.assertChallengeExists(named: "Detail Test")
        
        // Open detail
        dashboardPage.tapChallenge(named: "Detail Test")
        
        // Should see title
        challengeDetail.assertTitle(contains: "Detail Test")
    }
}
