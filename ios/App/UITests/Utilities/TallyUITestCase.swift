import XCTest

/// Base class for all UI tests with common setup and utilities
class TallyUITestCase: XCTestCase {
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        continueAfterFailure = false
        
        app = XCUIApplication()
        app.launchArguments = ["--uitesting"]
        app.launch()
    }
    
    override func tearDownWithError() throws {
        app = nil
        try super.tearDownWithError()
    }
    
    // MARK: - Wait Helpers
    
    func waitForElement(_ element: XCUIElement, timeout: TimeInterval = 10) -> Bool {
        element.waitForExistence(timeout: timeout)
    }
    
    func waitAndTap(_ element: XCUIElement, timeout: TimeInterval = 10) {
        XCTAssertTrue(waitForElement(element, timeout: timeout), "Element not found: \(element)")
        element.tap()
    }
    
    // MARK: - Text Entry
    
    func clearAndType(_ element: XCUIElement, text: String) {
        element.tap()
        if let currentValue = element.value as? String, !currentValue.isEmpty {
            let deleteString = String(repeating: XCUIKeyboardKey.delete.rawValue, count: currentValue.count)
            element.typeText(deleteString)
        }
        element.typeText(text)
    }
    
    // MARK: - Accessibility Helpers
    
    func element(withIdentifier identifier: String) -> XCUIElement {
        app.descendants(matching: .any)[identifier]
    }
    
    func button(withLabel label: String) -> XCUIElement {
        app.buttons[label]
    }
    
    func staticText(containing text: String) -> XCUIElement {
        app.staticTexts.containing(NSPredicate(format: "label CONTAINS[c] %@", text)).firstMatch
    }
}

// MARK: - Test Data

enum TestData {
    static let challengeName = "Push-ups"
    static let challengeTarget = "10000"
    static let entryCount = "50"
    
    static let testEmail = "test@example.com"
    static let testPassword = "TestPass123!"
}
