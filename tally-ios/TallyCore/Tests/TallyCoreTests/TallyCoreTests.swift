import XCTest
@testable import TallyCore

final class TallyCoreTests: XCTestCase {
  func testFeelingTypeDecodes() throws {
    let data = try JSONEncoder().encode(["feeling": "very-easy"])

    struct Wrapper: Codable { let feeling: FeelingType }
    let decoded = try JSONDecoder().decode(Wrapper.self, from: data)

    XCTAssertEqual(decoded.feeling, .veryEasy)
  }
}
