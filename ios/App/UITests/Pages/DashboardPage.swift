import XCTest

/// Page object for the Dashboard screen
struct DashboardPage {
    let app: XCUIApplication
    
    // MARK: - Elements
    
    var dashboard: XCUIElement {
        app.otherElements["dashboard"]
    }
    
    var createChallengeButton: XCUIElement {
        let byId = app.buttons.matching(identifier: "create-challenge-button")
        if byId.count > 1 {
            return byId.matching(NSPredicate(format: "label CONTAINS[c] %@", "Create")).firstMatch
        }
        if byId.firstMatch.exists { return byId.firstMatch }
        let emptyState = app.buttons["create-challenge-empty-button"]
        if emptyState.exists { return emptyState.firstMatch }
        return app.buttons["Create Challenge"].firstMatch
    }
    
    var challengeCards: XCUIElementQuery {
        app.descendants(matching: .any).matching(identifier: "challenge-card")
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
        app.descendants(matching: .any)["challenge-card-\(name)"]
    }
    
    func quickAddButton(forChallenge name: String) -> XCUIElement {
        challengeCard(named: name).buttons["quick-add"].firstMatch
    }
    
    func tapCreateChallenge() {
        let byId = app.buttons.matching(identifier: "create-challenge-button")
        if byId.count > 1 {
            byId.matching(NSPredicate(format: "label CONTAINS[c] %@", "Create")).firstMatch.tap()
            return
        }
        if byId.firstMatch.waitForExistence(timeout: 3) {
            byId.firstMatch.tap()
            return
        }
        let emptyState = app.buttons["create-challenge-empty-button"]
        if emptyState.waitForExistence(timeout: 3) {
            emptyState.firstMatch.tap()
        } else {
            app.buttons["Create Challenge"].firstMatch.tap()
        }
    }
    
    func tapChallenge(named name: String) {
        challengeCard(named: name).tap()
    }
    
    // MARK: - Assertions
    
    func assertChallengeExists(named name: String, timeout: TimeInterval = 10, file: StaticString = #file, line: UInt = #line) {
        let card = challengeCard(named: name)
        if !card.waitForExistence(timeout: timeout) {
            app.swipeUp()
            let fallback = app.buttons.containing(NSPredicate(format: "label CONTAINS[c] %@", name)).firstMatch
            XCTAssertTrue(
                fallback.waitForExistence(timeout: timeout),
                "Challenge '\(name)' should exist on dashboard",
                file: file,
                line: line
            )
            return
        }
        
        XCTAssertTrue(
            card.exists,
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
