import XCTest
@testable import TallyFeatureAPIClient

final class RequestsTests: XCTestCase {
    
    let encoder: JSONEncoder = {
        let e = JSONEncoder()
        e.keyEncodingStrategy = .convertToSnakeCase
        return e
    }()
    
    // MARK: - CreateChallengeRequest Tests
    
    func testCreateChallengeRequestEncoding() throws {
        let request = CreateChallengeRequest(
            name: "Daily Push-ups",
            target: 10000,
            timeframeType: .year,
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            color: "#FF4747",
            icon: "tally",
            isPublic: false
        )
        
        let data = try encoder.encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        
        XCTAssertEqual(json["name"] as? String, "Daily Push-ups")
        XCTAssertEqual(json["target"] as? Int, 10000)
        XCTAssertEqual(json["timeframe_type"] as? String, "year")
        XCTAssertEqual(json["start_date"] as? String, "2026-01-01")
        XCTAssertEqual(json["end_date"] as? String, "2026-12-31")
        XCTAssertEqual(json["color"] as? String, "#FF4747")
        XCTAssertEqual(json["icon"] as? String, "tally")
        XCTAssertEqual(json["is_public"] as? Bool, false)
    }
    
    func testCreateChallengeRequestMinimalEncoding() throws {
        let request = CreateChallengeRequest(
            name: "Quick Challenge",
            target: 100,
            timeframeType: .month
        )
        
        let data = try encoder.encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        
        XCTAssertEqual(json["name"] as? String, "Quick Challenge")
        XCTAssertEqual(json["target"] as? Int, 100)
        XCTAssertEqual(json["timeframe_type"] as? String, "month")
        // Optional fields should not be present or be null
    }
    
    // MARK: - UpdateChallengeRequest Tests
    
    func testUpdateChallengeRequestEncoding() throws {
        let request = UpdateChallengeRequest(
            name: "Updated Name",
            target: 5000,
            isArchived: true
        )
        
        let data = try encoder.encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        
        XCTAssertEqual(json["name"] as? String, "Updated Name")
        XCTAssertEqual(json["target"] as? Int, 5000)
        XCTAssertEqual(json["is_archived"] as? Bool, true)
    }
    
    func testUpdateChallengeRequestPartialEncoding() throws {
        let request = UpdateChallengeRequest(
            isPublic: true
        )
        
        let data = try encoder.encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        
        XCTAssertEqual(json["is_public"] as? Bool, true)
    }
    
    // MARK: - CreateEntryRequest Tests
    
    func testCreateEntryRequestEncoding() throws {
        let request = CreateEntryRequest(
            challengeId: "ch_123",
            date: "2026-01-15",
            count: 50,
            note: "Great session!",
            feeling: .great
        )
        
        let data = try encoder.encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        
        XCTAssertEqual(json["challenge_id"] as? String, "ch_123")
        XCTAssertEqual(json["date"] as? String, "2026-01-15")
        XCTAssertEqual(json["count"] as? Int, 50)
        XCTAssertEqual(json["note"] as? String, "Great session!")
        XCTAssertEqual(json["feeling"] as? String, "great")
    }
    
    func testCreateEntryRequestMinimalEncoding() throws {
        let request = CreateEntryRequest(
            challengeId: "ch_123",
            date: "2026-01-15",
            count: 25
        )
        
        let data = try encoder.encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        
        XCTAssertEqual(json["challenge_id"] as? String, "ch_123")
        XCTAssertEqual(json["date"] as? String, "2026-01-15")
        XCTAssertEqual(json["count"] as? Int, 25)
    }
    
    // MARK: - UpdateEntryRequest Tests
    
    func testUpdateEntryRequestEncoding() throws {
        let request = UpdateEntryRequest(
            count: 75,
            feeling: .tough
        )
        
        let data = try encoder.encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        
        XCTAssertEqual(json["count"] as? Int, 75)
        XCTAssertEqual(json["feeling"] as? String, "tough")
    }
}
