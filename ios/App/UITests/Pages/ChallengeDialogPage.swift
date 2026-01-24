import XCTest

/// Page object for the Challenge creation/edit dialog
struct ChallengeDialogPage {
    let app: XCUIApplication
    
    // MARK: - Elements
    
    var dialog: XCUIElement {
        // Try various ways to find the challenge form/dialog
        let byId = app.otherElements["challenge-form"]
        if byId.exists { return byId }
        
        // Sheets (iOS presents sheets)
        if app.sheets.firstMatch.exists { return app.sheets.firstMatch }
        
        // Navigation stack with form
        let navStack = app.navigationBars["New Challenge"]
        if navStack.exists { return navStack }
        
        let editNavStack = app.navigationBars["Edit Challenge"]
        if editNavStack.exists { return editNavStack }
        
        return app.otherElements["challenge-dialog"]
    }
    
    var nameTextField: XCUIElement {
        // Find by placeholder "Challenge name"
        let byPlaceholder = app.textFields["Challenge name"]
        if byPlaceholder.exists { return byPlaceholder }
        return app.textFields["Challenge Name"].firstMatch
    }
    
    var targetTextField: XCUIElement {
        // Find the target text field - it's inside a stepper, labeled "Target"
        let byLabel = app.textFields["Target"]
        if byLabel.exists { return byLabel }
        return app.textFields.matching(NSPredicate(format: "value CONTAINS '100'")).firstMatch
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
