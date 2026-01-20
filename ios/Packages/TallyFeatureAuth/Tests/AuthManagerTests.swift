import XCTest
@testable import TallyFeatureAuth

final class AuthManagerTests: XCTestCase {
    // Note: Full auth tests require Clerk SDK configuration
    // These are placeholder tests for the module structure
    
    func testAuthErrorDescriptions() {
        XCTAssertNotNil(AuthError.notConfigured.errorDescription)
        XCTAssertFalse(AuthError.networkError(NSError(domain: "test", code: 0)).isNonFatal == false)
    }
}
