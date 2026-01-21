import XCTest

/// Page object for the Challenge detail screen
struct ChallengeDetailPage {
    let app: XCUIApplication
    
    // MARK: - Elements
    
    var title: XCUIElement {
        app.staticTexts["challenge-title"]
    }
    
    var progressRing: XCUIElement {
        app.otherElements["progress-ring"]
    }
    
    var paceStatus: XCUIElement {
        app.staticTexts["pace-status"]
    }
    
    var heatmap: XCUIElement {
        app.otherElements["activity-heatmap"]
    }
    
    var addEntryButton: XCUIElement {
        app.buttons["Add Entry"].firstMatch
    }
    
    var editButton: XCUIElement {
        app.buttons["Edit"].firstMatch
    }
    
    var deleteButton: XCUIElement {
        app.buttons["Delete"].firstMatch
    }
    
    var archiveButton: XCUIElement {
        app.buttons["Archive"].firstMatch
    }
    
    var backButton: XCUIElement {
        app.navigationBars.buttons.firstMatch
    }
    
    // MARK: - Actions
    
    func tapAddEntry() {
        addEntryButton.tap()
    }
    
    func tapEdit() {
        editButton.tap()
    }
    
    func tapDelete() {
        deleteButton.tap()
    }
    
    func tapBack() {
        backButton.tap()
    }
    
    // MARK: - Assertions
    
    func assertTitle(contains text: String, file: StaticString = #file, line: UInt = #line) {
        XCTAssertTrue(
            app.staticTexts.containing(NSPredicate(format: "label CONTAINS[c] %@", text)).firstMatch.exists,
            "Title should contain '\(text)'",
            file: file,
            line: line
        )
    }
}
