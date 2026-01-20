import XCTest
@testable import TallyCore

final class UserTests: XCTestCase {
    func testDisplayName_withFullName() {
        let user = TallyUser(id: "1", firstName: "John", lastName: "Doe")
        XCTAssertEqual(user.displayName, "John Doe")
    }
    
    func testDisplayName_withFirstNameOnly() {
        let user = TallyUser(id: "1", firstName: "John")
        XCTAssertEqual(user.displayName, "John")
    }
    
    func testDisplayName_withEmailOnly() {
        let user = TallyUser(id: "1", email: "john@example.com")
        XCTAssertEqual(user.displayName, "john@example.com")
    }
    
    func testDisplayName_fallback() {
        let user = TallyUser(id: "1")
        XCTAssertEqual(user.displayName, "User")
    }
}
