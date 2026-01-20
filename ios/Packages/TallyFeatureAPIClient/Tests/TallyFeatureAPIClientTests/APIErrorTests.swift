import XCTest
@testable import TallyFeatureAPIClient

final class APIErrorTests: XCTestCase {
    
    // MARK: - Error Description Tests
    
    func testNotAuthenticatedDescription() {
        let error = APIError.notAuthenticated
        XCTAssertEqual(error.errorDescription, "Not authenticated. Please sign in.")
    }
    
    func testNetworkErrorDescription() {
        let underlying = NSError(domain: NSURLErrorDomain, code: NSURLErrorNotConnectedToInternet)
        let error = APIError.networkError(underlying)
        XCTAssertTrue(error.errorDescription?.contains("Network error") ?? false)
    }
    
    func testHTTPErrorWithMessageDescription() {
        let error = APIError.httpError(statusCode: 500, message: "Internal Server Error")
        XCTAssertEqual(error.errorDescription, "HTTP 500: Internal Server Error")
    }
    
    func testHTTPErrorWithoutMessageDescription() {
        let error = APIError.httpError(statusCode: 502, message: nil)
        XCTAssertEqual(error.errorDescription, "HTTP error 502")
    }
    
    func testValidationFailedDescription() {
        let error = APIError.validationFailed("Invalid input", details: ["name": "Required"])
        XCTAssertEqual(error.errorDescription, "Validation failed: Invalid input")
    }
    
    func testForbiddenDescription() {
        let error = APIError.forbidden("Access denied to this resource")
        XCTAssertEqual(error.errorDescription, "Access denied: Access denied to this resource")
    }
    
    func testNotFoundDescription() {
        let error = APIError.notFound("Challenge not found")
        XCTAssertEqual(error.errorDescription, "Not found: Challenge not found")
    }
    
    // MARK: - Recoverable Tests
    
    func testNetworkErrorIsRecoverable() {
        let underlying = NSError(domain: NSURLErrorDomain, code: NSURLErrorTimedOut)
        let error = APIError.networkError(underlying)
        XCTAssertTrue(error.isRecoverable)
    }
    
    func testServerErrorIsRecoverable() {
        let error = APIError.serverError("Service unavailable")
        XCTAssertTrue(error.isRecoverable)
    }
    
    func test500ErrorIsRecoverable() {
        let error = APIError.httpError(statusCode: 500, message: nil)
        XCTAssertTrue(error.isRecoverable)
    }
    
    func test503ErrorIsRecoverable() {
        let error = APIError.httpError(statusCode: 503, message: nil)
        XCTAssertTrue(error.isRecoverable)
    }
    
    func testValidationErrorIsNotRecoverable() {
        let error = APIError.validationFailed("Bad input", details: nil)
        XCTAssertFalse(error.isRecoverable)
    }
    
    func testNotFoundIsNotRecoverable() {
        let error = APIError.notFound("Resource missing")
        XCTAssertFalse(error.isRecoverable)
    }
    
    func test400ErrorIsNotRecoverable() {
        let error = APIError.httpError(statusCode: 400, message: nil)
        XCTAssertFalse(error.isRecoverable)
    }
    
    // MARK: - Requires Reauth Tests
    
    func testNotAuthenticatedRequiresReauth() {
        let error = APIError.notAuthenticated
        XCTAssertTrue(error.requiresReauth)
    }
    
    func test401ErrorRequiresReauth() {
        let error = APIError.httpError(statusCode: 401, message: nil)
        XCTAssertTrue(error.requiresReauth)
    }
    
    func test403ErrorDoesNotRequireReauth() {
        let error = APIError.forbidden("Not allowed")
        XCTAssertFalse(error.requiresReauth)
    }
    
    func testNetworkErrorDoesNotRequireReauth() {
        let underlying = NSError(domain: NSURLErrorDomain, code: NSURLErrorNotConnectedToInternet)
        let error = APIError.networkError(underlying)
        XCTAssertFalse(error.requiresReauth)
    }
}
