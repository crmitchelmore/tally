import XCTest
@testable import Tally

final class EntriesTests: XCTestCase {
    
    func testEntryResponseDecoding() throws {
        let json = """
        {
            "_id": "entry_456",
            "challengeId": "challenge_123",
            "date": "2026-01-16",
            "count": 5,
            "note": "Good session",
            "feeling": "easy",
            "createdAt": 1705420800000
        }
        """
        
        let data = json.data(using: .utf8)!
        let entry = try JSONDecoder().decode(EntryResponse.self, from: data)
        
        XCTAssertEqual(entry.id, "entry_456")
        XCTAssertEqual(entry.challengeId, "challenge_123")
        XCTAssertEqual(entry.date, "2026-01-16")
        XCTAssertEqual(entry.count, 5)
        XCTAssertEqual(entry.note, "Good session")
        XCTAssertEqual(entry.feeling, "easy")
    }
    
    func testEntryResponseWithNullOptionals() throws {
        let json = """
        {
            "_id": "entry_789",
            "challengeId": "challenge_123",
            "date": "2026-01-16",
            "count": 10,
            "note": null,
            "feeling": null,
            "createdAt": 1705420800000
        }
        """
        
        let data = json.data(using: .utf8)!
        let entry = try JSONDecoder().decode(EntryResponse.self, from: data)
        
        XCTAssertNil(entry.note)
        XCTAssertNil(entry.feeling)
    }
    
    func testCreateEntryRequestEncoding() throws {
        let request = CreateEntryRequest(
            challengeId: "challenge_123",
            date: "2026-01-16",
            count: 5,
            note: "Great workout!",
            feeling: "moderate"
        )
        
        let data = try JSONEncoder().encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        
        XCTAssertEqual(json["challengeId"] as? String, "challenge_123")
        XCTAssertEqual(json["date"] as? String, "2026-01-16")
        XCTAssertEqual(json["count"] as? Int, 5)
        XCTAssertEqual(json["note"] as? String, "Great workout!")
        XCTAssertEqual(json["feeling"] as? String, "moderate")
    }
}
