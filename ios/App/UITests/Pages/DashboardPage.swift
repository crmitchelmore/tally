import XCTest

/// Page object for the Dashboard screen
struct DashboardPage {
    let app: XCUIApplication
    
    // MARK: - Elements
    
    var dashboard: XCUIElement {
        app.otherElements["dashboard"]
    }
    
    var createChallengeButton: XCUIElement {
        // Try identifier first, then fall back to label
        let byId = app.buttons["create-challenge-button"]
        if byId.exists { return byId }
        return app.buttons["Create Challenge"].firstMatch
    }
    
    var challengeCards: XCUIElementQuery {
        app.otherElements.matching(identifier: "challenge-card")
    }
    
    var emptyState: XCUIElement {
        app.otherElements["empty-state"]
    }
    
    var syncStatus: XCUIElement {
        app.staticTexts["sync-status"]
    }
    
    var settingsButton: XCUIElement {
        app.buttons["Settings"].firstMatch
    }
    
    // MARK: - Actions
    
    func challengeCard(named name: String) -> XCUIElement {
        // Try specific identifier first
        let byId = app.buttons["challenge-card-\(name)"]
        if byId.exists { return byId }
        
        // Fall back to finding by text content
        return app.buttons.containing(NSPredicate(format: "label CONTAINS[c] %@", name)).firstMatch
    }
    
    func quickAddButton(forChallenge name: String) -> XCUIElement {
        challengeCard(named: name).buttons["quick-add"].firstMatch
    }
    
    func tapCreateChallenge() {
        // Try identifier first, then fall back to label
        let byId = app.buttons["create-challenge-button"]
        if byId.waitForExistence(timeout: 3) {
            byId.tap()
        } else {
            app.buttons["Create Challenge"].firstMatch.tap()
        }
    }
    
    func tapChallenge(named name: String) {
        challengeCard(named: name).tap()
    }
    
    // MARK: - Assertions
    
    func assertChallengeExists(named name: String, timeout: TimeInterval = 10, file: StaticString = #file, line: UInt = #line) {
        XCTAssertTrue(
            challengeCard(named: name).waitForExistence(timeout: timeout),
            "Challenge '\(name)' should exist on dashboard",
            file: file,
            line: line
        )
    }
    
    func assertChallengeNotExists(named name: String, file: StaticString = #file, line: UInt = #line) {
        XCTAssertFalse(
            challengeCard(named: name).exists,
            "Challenge '\(name)' should not exist on dashboard",
            file: file,
            line: line
        )
    }
}
