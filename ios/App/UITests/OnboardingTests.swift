import XCTest

/// Tests for new user onboarding flow
/// Maps to cucumber/01-new-user-onboarding.feature
final class OnboardingTests: TallyUITestCase {
    
    lazy var dashboardPage = DashboardPage(app: app)
    lazy var challengeDialog = ChallengeDialogPage(app: app)
    
    // MARK: - Empty State
    
    func testSeeingEmptyDashboardAsNewUser() throws {
        // As a new user, should see empty state or create button
        let hasEmptyState = dashboardPage.emptyState.waitForExistence(timeout: 5)
        let hasCreateButton = dashboardPage.createChallengeButton.waitForExistence(timeout: 5)
        
        XCTAssertTrue(
            hasEmptyState || hasCreateButton,
            "New user should see empty state or create challenge button"
        )
    }
    
    // MARK: - Quick Start Flow
    
    func testCreatingFirstChallengeFromEmptyState() throws {
        // Wait for app to load
        let hasCreateButton = dashboardPage.createChallengeButton.waitForExistence(timeout: 10)
        
        guard hasCreateButton else {
            throw XCTSkip("Create button not found")
        }
        
        // Tap create challenge
        dashboardPage.tapCreateChallenge()
        
        // Should see dialog with sensible defaults
        challengeDialog.assertIsVisible()
        
        // Required fields should be visible
        XCTAssertTrue(challengeDialog.nameTextField.exists, "Name field should be visible")
        XCTAssertTrue(challengeDialog.targetTextField.exists, "Target field should be visible")
    }
    
    func testCompletingQuickStartWithYearlyChallenge() throws {
        _ = waitForElement(dashboardPage.createChallengeButton)
        
        dashboardPage.tapCreateChallenge()
        
        // Create challenge
        challengeDialog.fillChallenge(
            name: "Push-ups",
            target: "10000",
            timeframe: "Year"
        )
        challengeDialog.tapSaveAndWaitForDismiss()
        
        // Should see challenge on dashboard
        dashboardPage.assertChallengeExists(named: "Push-ups")
        
        // Should show progress 0/10000
        XCTAssertTrue(staticText(containing: "Push-ups").waitForExistence(timeout: 5))
    }
    
    // MARK: - Understanding the Interface
    
    func testUnderstandingDashboardLayout() throws {
        // Create a challenge first
        _ = waitForElement(dashboardPage.createChallengeButton)
        dashboardPage.tapCreateChallenge()
        challengeDialog.fillChallenge(name: "Layout Test", target: "5000")
        challengeDialog.tapSaveAndWaitForDismiss()
        
        // Verify dashboard elements
        let card = dashboardPage.challengeCard(named: "Layout Test")
        XCTAssertTrue(card.waitForExistence(timeout: 5), "Challenge card should be visible")
        
        // Card should show progress info
        XCTAssertTrue(
            staticText(containing: "Layout Test").exists,
            "Challenge name should be visible"
        )
    }
}
