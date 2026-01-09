import XCTest
@testable import TallyCore

final class TallyCoreTests: XCTestCase {
  func testFeelingTypeDecodes() throws {
    let data = try JSONEncoder().encode(["feeling": "very-easy"])

    struct Wrapper: Codable { let feeling: FeelingType }
    let decoded = try JSONDecoder().decode(Wrapper.self, from: data)

    XCTAssertEqual(decoded.feeling, .veryEasy)
  }

  func testChallengeDecodes() throws {
    let json = """
    {
      "_id": "ch_123",
      "userId": "u_123",
      "name": "Push-ups",
      "targetNumber": 1000,
      "year": 2026,
      "color": "#fff",
      "icon": "dumbbell",
      "timeframeUnit": "year",
      "startDate": null,
      "endDate": null,
      "isPublic": true,
      "archived": false,
      "createdAt": 1
    }
    """

    let decoded = try JSONDecoder().decode(Challenge.self, from: Data(json.utf8))
    XCTAssertEqual(decoded._id, "ch_123")
    XCTAssertEqual(decoded.timeframeUnit, .year)
  }

  func testCreateEntryEncodes() throws {
    let req = TallyAPI.CreateEntryRequest(challengeId: "c", date: "2026-01-09", count: 5, feeling: .easy)
    let data = try JSONEncoder().encode(req)

    let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any]
    XCTAssertEqual(obj?["challengeId"] as? String, "c")
    XCTAssertEqual(obj?["date"] as? String, "2026-01-09")
    XCTAssertEqual(obj?["count"] as? Double, 5)
    XCTAssertEqual(obj?["feeling"] as? String, "easy")
  }
}
