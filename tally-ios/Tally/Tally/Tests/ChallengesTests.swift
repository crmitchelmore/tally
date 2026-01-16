import SwiftUI
import XCTest
@testable import Tally

final class ChallengesTests: XCTestCase {
    
    // MARK: - Model Tests
    
    func testChallengeResponseDecoding() throws {
        let json = """
        {
            "_id": "challenge_123",
            "name": "Read 100 Books",
            "targetNumber": 100,
            "color": "#3B82F6",
            "icon": "📚",
            "timeframeUnit": "year",
            "year": 2026,
            "isPublic": false,
            "archived": false,
            "createdAt": 1705420800000
        }
        """
        
        let data = json.data(using: .utf8)!
        let challenge = try JSONDecoder().decode(ChallengeResponse.self, from: data)
        
        XCTAssertEqual(challenge.id, "challenge_123")
        XCTAssertEqual(challenge.name, "Read 100 Books")
        XCTAssertEqual(challenge.targetNumber, 100)
        XCTAssertEqual(challenge.color, "#3B82F6")
        XCTAssertEqual(challenge.icon, "📚")
        XCTAssertEqual(challenge.timeframeUnit, "year")
        XCTAssertEqual(challenge.year, 2026)
        XCTAssertFalse(challenge.isPublic)
        XCTAssertFalse(challenge.archived)
    }
    
    func testCreateChallengeRequestEncoding() throws {
        let request = CreateChallengeRequest(
            name: "Exercise Daily",
            targetNumber: 365,
            color: "#10B981",
            icon: "💪",
            timeframeUnit: "year",
            year: 2026,
            isPublic: true
        )
        
        let data = try JSONEncoder().encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as! [String: Any]
        
        XCTAssertEqual(json["name"] as? String, "Exercise Daily")
        XCTAssertEqual(json["targetNumber"] as? Int, 365)
        XCTAssertEqual(json["color"] as? String, "#10B981")
        XCTAssertEqual(json["icon"] as? String, "💪")
        XCTAssertEqual(json["isPublic"] as? Bool, true)
    }
    
    // MARK: - Color Extension Tests
    
    func testColorFromHex() {
        // Test 6-digit hex
        let blue = Color(hex: "#3B82F6")
        XCTAssertNotNil(blue)
        
        // Test without hash
        let green = Color(hex: "10B981")
        XCTAssertNotNil(green)
    }
}
