import XCTest

/// Page object for the Entry input dialog/sheet
struct EntryDialogPage {
    let app: XCUIApplication
    
    // MARK: - Elements
    
    var dialog: XCUIElement {
        // Try identifier first, then fall back to sheet
        let byId = app.otherElements["addEntrySheet"]
        return byId.exists ? byId : app.sheets.firstMatch
    }
    
    var countInput: XCUIElement {
        app.textFields["countInput"].firstMatch
    }
    
    var incrementButton: XCUIElement {
        app.buttons["incrementButton"].firstMatch
    }
    
    var decrementButton: XCUIElement {
        app.buttons["decrementButton"].firstMatch
    }
    
    var datePicker: XCUIElement {
        app.datePickers["datePicker"].firstMatch.exists 
            ? app.datePickers["datePicker"].firstMatch
            : app.datePickers.firstMatch
    }
    
    var noteInput: XCUIElement {
        app.textFields["noteInput"].firstMatch.exists
            ? app.textFields["noteInput"].firstMatch
            : app.textViews["noteInput"].firstMatch
    }
    
    var saveButton: XCUIElement {
        app.buttons["Save"].firstMatch
    }
    
    var cancelButton: XCUIElement {
        app.buttons["Cancel"].firstMatch
    }
    
    // Feeling buttons
    var feelingGreat: XCUIElement { app.buttons["feelingGreat"].firstMatch }
    var feelingGood: XCUIElement { app.buttons["feelingGood"].firstMatch }
    var feelingOkay: XCUIElement { app.buttons["feelingOkay"].firstMatch }
    var feelingTough: XCUIElement { app.buttons["feelingTough"].firstMatch }
    
    // MARK: - Actions
    
    func enterCount(_ count: String) {
        if countInput.waitForExistence(timeout: 3) {
            countInput.tap()
            // Clear existing text
            if let existingText = countInput.value as? String, !existingText.isEmpty {
                let deleteString = String(repeating: XCUIKeyboardKey.delete.rawValue, count: existingText.count)
                countInput.typeText(deleteString)
            }
            countInput.typeText(count)
        }
    }
    
    func incrementCount() {
        incrementButton.tap()
    }
    
    func decrementCount() {
        decrementButton.tap()
    }
    
    func selectFeeling(_ feeling: String) {
        switch feeling.lowercased() {
        case "great": feelingGreat.tap()
        case "good": feelingGood.tap()
        case "okay": feelingOkay.tap()
        case "tough": feelingTough.tap()
        default: break
        }
    }
    
    func enterNote(_ note: String) {
        if noteInput.waitForExistence(timeout: 3) {
            noteInput.tap()
            noteInput.typeText(note)
        }
    }
    
    func addEntry(count: String) {
        enterCount(count)
        save()
    }
    
    func addEntry(count: String, note: String? = nil, feeling: String? = nil) {
        enterCount(count)
        if let note = note {
            enterNote(note)
        }
        if let feeling = feeling {
            selectFeeling(feeling)
        }
        save()
    }
    
    func save() {
        saveButton.tap()
    }
    
    func tapCancel() {
        cancelButton.tap()
    }
    
    // MARK: - Assertions
    
    func assertIsVisible(file: StaticString = #file, line: UInt = #line) {
        XCTAssertTrue(
            dialog.waitForExistence(timeout: 5) || countInput.waitForExistence(timeout: 5),
            "Entry dialog should be visible",
            file: file,
            line: line
        )
    }
}
