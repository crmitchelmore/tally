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
        // Try accessibility identifier first
        let byId = app.textFields["challenge-name-input"]
        if byId.exists { return byId }
        // Fall back to placeholder text
        let byPlaceholder = app.textFields["Challenge name"]
        if byPlaceholder.exists { return byPlaceholder }
        return app.textFields["Challenge Name"].firstMatch
    }
    
    var targetTextField: XCUIElement {
        // Try accessibility identifier first
        let byId = app.textFields["challenge-target-input"]
        if byId.exists { return byId }
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
        // Try accessibility identifier first
        let byId = app.buttons["save-challenge-button"]
        if byId.exists { return byId }
        // Fall back to text labels
        let saveBtn = app.buttons["Save"].firstMatch
        if saveBtn.exists { return saveBtn }
        return app.buttons["Create"].firstMatch
    }
    
    var cancelButton: XCUIElement {
        app.buttons["Cancel"].firstMatch
    }
    
    // MARK: - Actions
    
    func fillChallenge(name: String, target: String? = nil, timeframe: String? = nil) {
        // Wait for the form to be visible
        _ = nameTextField.waitForExistence(timeout: 5)
        
        // Fill name
        nameTextField.tap()
        nameTextField.typeText(name)
        
        // Fill target only if specified (use default otherwise)
        if let target = target, targetTextField.waitForExistence(timeout: 3) {
            targetTextField.tap()
            
            // Clear existing value by deleting characters
            let currentValue = targetTextField.value as? String ?? ""
            if !currentValue.isEmpty {
                let deleteString = String(repeating: XCUIKeyboardKey.delete.rawValue, count: currentValue.count + 5)
                targetTextField.typeText(deleteString)
            }
            targetTextField.typeText(target)
        }
        
        if let timeframe = timeframe, timeframePicker.exists {
            timeframePicker.tap()
            app.pickerWheels.firstMatch.adjust(toPickerWheelValue: timeframe)
        }
    }
    
    func tapSave() {
        _ = saveButton.waitForExistence(timeout: 3)
        saveButton.tap()
    }
    
    func tapSaveAndWaitForDismiss() {
        _ = saveButton.waitForExistence(timeout: 3)
        saveButton.tap()
        // Wait for the sheet to dismiss (form/nav bar disappears)
        let form = app.otherElements["challenge-form"]
        _ = form.waitForNonExistence(timeout: 5)
        // Also wait a bit for UI to settle
        Thread.sleep(forTimeInterval: 0.5)
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
