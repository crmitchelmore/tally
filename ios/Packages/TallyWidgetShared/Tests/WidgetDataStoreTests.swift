import XCTest
@testable import TallyWidgetShared

final class WidgetDataStoreTests: XCTestCase {
    
    func testWidgetChallengeProgress() {
        let challenge = WidgetChallenge(
            id: "test-1",
            name: "Push-ups",
            target: 100,
            currentCount: 50,
            color: "#4B5563",
            icon: "figure.strengthtraining.traditional",
            streakCurrent: 5,
            streakBest: 10,
            daysRemaining: 25,
            perDayRequired: 4.0,
            currentPace: 5.0,
            paceStatus: .ahead,
            lastUpdated: Date()
        )
        
        XCTAssertEqual(challenge.progress, 0.5)
        XCTAssertEqual(challenge.remaining, 50)
        XCTAssertFalse(challenge.isComplete)
    }
    
    func testWidgetChallengeComplete() {
        let challenge = WidgetChallenge(
            id: "test-2",
            name: "Read Books",
            target: 12,
            currentCount: 15,
            color: "#10B981",
            icon: "book.fill",
            streakCurrent: 30,
            streakBest: 30,
            daysRemaining: 0,
            perDayRequired: 0,
            currentPace: 0,
            paceStatus: .none,
            lastUpdated: Date()
        )
        
        XCTAssertEqual(challenge.progress, 1.0)
        XCTAssertEqual(challenge.remaining, 0)
        XCTAssertTrue(challenge.isComplete)
    }
    
    func testPaceStatusDisplayText() {
        XCTAssertEqual(WidgetPaceStatus.ahead.displayText, "Ahead")
        XCTAssertEqual(WidgetPaceStatus.onPace.displayText, "On pace")
        XCTAssertEqual(WidgetPaceStatus.behind.displayText, "Behind")
        XCTAssertEqual(WidgetPaceStatus.none.displayText, "")
    }
}
