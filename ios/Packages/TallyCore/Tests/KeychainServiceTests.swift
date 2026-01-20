import XCTest
@testable import TallyCore

final class KeychainServiceTests: XCTestCase {
    func testStoreAndRetrieveToken() throws {
        let service = KeychainService.shared
        let testToken = "test_token_\(UUID().uuidString)"
        
        // Store
        try service.storeToken(testToken)
        
        // Retrieve
        let retrieved = service.retrieveToken()
        XCTAssertEqual(retrieved, testToken)
        
        // Cleanup
        service.deleteToken()
        XCTAssertNil(service.retrieveToken())
    }
    
    func testHasToken() throws {
        let service = KeychainService.shared
        
        service.deleteToken()
        XCTAssertFalse(service.hasToken)
        
        try service.storeToken("test")
        XCTAssertTrue(service.hasToken)
        
        service.deleteToken()
        XCTAssertFalse(service.hasToken)
    }
}
