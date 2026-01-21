import XCTest

/// Page object for the Challenge creation/edit dialog
struct ChallengeDialogPage {
    let app: XCUIApplication
    
    // MARK: - Elements
    
    var dialog: XCUIElement {
        app.sheets.firstMatch.exists ? app.sheets.firstMatch : app.otherElements["challenge-dialog"]
    }
    
    var nameTextField: XCUIElement {
        app.textFields["Challenge Name"].firstMatch
    }
    
    var targetTextField: XCUIElement {
        app.textFields["Target"].firstMatch
    }
    
    var timeframePicker: XCUIElement {
        app.pickers["Timeframe"].firstMatch
    }
    
    var publicToggle: XCUIElement {
        app.switches["Public"].firstMatch
    }
    
    var saveButton: XCUIElement {
        app.buttons["Save"].firstMatch.exists ? 
            app.buttons["Save"].firstMatch : 
            app.buttons["Create"].firstMatch
    }
    
    var cancelButton: XCUIElement {
        app.buttons["Cancel"].firstMatch
    }
    
    // MARK: - Actions
    
    func fillChallenge(name: String, target: String, timeframe: String? = nil) {
        nameTextField.tap()
        nameTextField.typeText(name)
        
        targetTextField.tap()
        targetTextField.typeText(target)
        
        if let timeframe = timeframe, timeframePicker.exists {
            timeframePicker.tap()
            app.pickerWheels.firstMatch.adjust(toPickerWheelValue: timeframe)
        }
    }
    
    func tapSave() {
        saveButton.tap()
    }
    
    func tapCancel() {
        cancelButton.tap()
    }
    
    // MARK: - Assertions
    
    func assertIsVisible(file: StaticString = #file, line: UInt = #line) {
        XCTAssertTrue(
            dialog.waitForExistence(timeout: 5),
            "Challenge dialog should be visible",
            file: file,
            line: line
        )
    }
}
