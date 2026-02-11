import XCTest
@testable import TallyShortcuts

final class TallyShortcutsTests: XCTestCase {
    
    @available(iOS 17.0, *)
    func testChallengeEntityCreation() {
        let entity = ChallengeEntity(
            id: "test-123",
            name: "Push-ups",
            target: 1000,
            currentCount: 500,
            color: "#4B5563",
            unitLabel: "reps"
        )
        
        XCTAssertEqual(entity.id, "test-123")
        XCTAssertEqual(entity.name, "Push-ups")
        XCTAssertEqual(entity.target, 1000)
        XCTAssertEqual(entity.currentCount, 500)
    }
    
    @available(iOS 17.0, *)
    func testChallengeEntityDisplayRepresentation() {
        let entity = ChallengeEntity(
            id: "test-456",
            name: "Reading",
            target: 52,
            currentCount: 30,
            color: "#10B981",
            unitLabel: "books"
        )
        
        let display = entity.displayRepresentation
        XCTAssertEqual(display.title, "Reading")
    }
}
