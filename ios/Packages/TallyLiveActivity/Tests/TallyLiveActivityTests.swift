import XCTest
@testable import TallyLiveActivity

final class TallyLiveActivityTests: XCTestCase {
    
    func testActivityAttributesContentState() {
        let state = TallyActivityAttributes.ContentState(
            sessionCount: 25,
            totalCount: 500,
            target: 1000,
            streak: 7
        )
        
        XCTAssertEqual(state.progress, 0.5)
        XCTAssertEqual(state.remaining, 500)
    }
    
    func testActivityAttributesComplete() {
        let state = TallyActivityAttributes.ContentState(
            sessionCount: 100,
            totalCount: 1200,
            target: 1000,
            streak: 30
        )
        
        XCTAssertEqual(state.progress, 1.0)
        XCTAssertEqual(state.remaining, 0)
    }
    
    func testActivityAttributesCreation() {
        let attributes = TallyActivityAttributes(
            challengeId: "test-123",
            challengeName: "Push-ups",
            challengeColor: "#4B5563",
            unitLabel: "reps"
        )
        
        XCTAssertEqual(attributes.challengeId, "test-123")
        XCTAssertEqual(attributes.challengeName, "Push-ups")
        XCTAssertEqual(attributes.challengeColor, "#4B5563")
        XCTAssertEqual(attributes.unitLabel, "reps")
    }
}
