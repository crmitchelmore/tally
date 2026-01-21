import XCTest

/// Page object for the Entry input dialog
struct EntryDialogPage {
    let app: XCUIApplication
    
    // MARK: - Elements
    
    var dialog: XCUIElement {
        app.sheets.firstMatch.exists ? app.sheets.firstMatch : app.otherElements["entry-dialog"]
    }
    
    var countTextField: XCUIElement {
        app.textFields["Count"].firstMatch
    }
    
    var datePicker: XCUIElement {
        app.datePickers.firstMatch
    }
    
    var noteTextField: XCUIElement {
        app.textFields["Note"].firstMatch
    }
    
    var addSetsButton: XCUIElement {
        app.buttons["Add Sets"].firstMatch
    }
    
    var addButton: XCUIElement {
        app.buttons["Add"].firstMatch
    }
    
    var cancelButton: XCUIElement {
        app.buttons["Cancel"].firstMatch
    }
    
    // MARK: - Actions
    
    func enterCount(_ count: String) {
        countTextField.tap()
        countTextField.typeText(count)
    }
    
    func addEntry(count: String) {
        enterCount(count)
        addButton.tap()
    }
    
    func tapCancel() {
        cancelButton.tap()
    }
    
    // MARK: - Assertions
    
    func assertIsVisible(file: StaticString = #file, line: UInt = #line) {
        XCTAssertTrue(
            dialog.waitForExistence(timeout: 5) || countTextField.waitForExistence(timeout: 5),
            "Entry dialog should be visible",
            file: file,
            line: line
        )
    }
}
