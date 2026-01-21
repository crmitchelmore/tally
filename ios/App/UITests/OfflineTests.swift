import XCTest

/// Tests for offline user experience
/// Maps to cucumber/02-offline-user-experience.feature
final class OfflineTests: TallyUITestCase {
    
    lazy var dashboardPage = DashboardPage(app: app)
    lazy var challengeDialog = ChallengeDialogPage(app: app)
    
    // MARK: - Starting as Offline User
    
    func testLaunchingAppWithoutAccount() throws {
        // App should launch and show dashboard
        XCTAssertTrue(
            dashboardPage.createChallengeButton.waitForExistence(timeout: 10),
            "Should be able to use app without account"
        )
    }
    
    func testCanCreateChallengeWhileOffline() throws {
        _ = waitForElement(dashboardPage.createChallengeButton)
        
        // Create a challenge (should work offline)
        dashboardPage.tapCreateChallenge()
        challengeDialog.fillChallenge(name: "Offline Challenge", target: "1000")
        challengeDialog.tapSave()
        
        // Should be visible immediately
        dashboardPage.assertChallengeExists(named: "Offline Challenge")
    }
    
    func testDataPersistsAcrossAppRestart() throws {
        // Create a challenge
        _ = waitForElement(dashboardPage.createChallengeButton)
        dashboardPage.tapCreateChallenge()
        challengeDialog.fillChallenge(name: "Persistence Test", target: "500")
        challengeDialog.tapSave()
        dashboardPage.assertChallengeExists(named: "Persistence Test")
        
        // Terminate and relaunch
        app.terminate()
        app.launch()
        
        // Challenge should still exist
        _ = waitForElement(dashboardPage.createChallengeButton, timeout: 10)
        dashboardPage.assertChallengeExists(named: "Persistence Test")
    }
    
    // MARK: - Sync Status
    
    func testViewSyncStatusAsOfflineUser() throws {
        _ = waitForElement(dashboardPage.createChallengeButton)
        
        // Look for sync status indicator
        if dashboardPage.syncStatus.waitForExistence(timeout: 5) {
            let statusText = dashboardPage.syncStatus.label
            // Should indicate local/offline mode
            XCTAssertTrue(
                statusText.lowercased().contains("local") || 
                statusText.lowercased().contains("offline"),
                "Sync status should indicate local/offline mode"
            )
        }
    }
}
