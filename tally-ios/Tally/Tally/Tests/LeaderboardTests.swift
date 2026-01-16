import XCTest
@testable import Tally

final class LeaderboardTests: XCTestCase {
    
    func testLeaderboardEntryDecoding() throws {
        let json = """
        {
            "clerkId": "user_123",
            "name": "John Doe",
            "avatarUrl": "https://example.com/avatar.jpg",
            "total": 150,
            "rank": 1
        }
        """
        
        let data = json.data(using: .utf8)!
        let entry = try JSONDecoder().decode(LeaderboardEntry.self, from: data)
        
        XCTAssertEqual(entry.id, "user_123")
        XCTAssertEqual(entry.name, "John Doe")
        XCTAssertEqual(entry.avatarUrl, "https://example.com/avatar.jpg")
        XCTAssertEqual(entry.total, 150)
        XCTAssertEqual(entry.rank, 1)
    }
    
    func testLeaderboardEntryWithNullName() throws {
        let json = """
        {
            "clerkId": "user_456",
            "name": null,
            "avatarUrl": null,
            "total": 50,
            "rank": 5
        }
        """
        
        let data = json.data(using: .utf8)!
        let entry = try JSONDecoder().decode(LeaderboardEntry.self, from: data)
        
        XCTAssertNil(entry.name)
        XCTAssertNil(entry.avatarUrl)
        XCTAssertEqual(entry.rank, 5)
    }
    
    func testLeaderboardArrayDecoding() throws {
        let json = """
        [
            {"clerkId": "u1", "name": "Alice", "avatarUrl": null, "total": 100, "rank": 1},
            {"clerkId": "u2", "name": "Bob", "avatarUrl": null, "total": 80, "rank": 2},
            {"clerkId": "u3", "name": null, "avatarUrl": null, "total": 60, "rank": 3}
        ]
        """
        
        let data = json.data(using: .utf8)!
        let entries = try JSONDecoder().decode([LeaderboardEntry].self, from: data)
        
        XCTAssertEqual(entries.count, 3)
        XCTAssertEqual(entries[0].name, "Alice")
        XCTAssertEqual(entries[1].rank, 2)
        XCTAssertNil(entries[2].name)
    }
}
