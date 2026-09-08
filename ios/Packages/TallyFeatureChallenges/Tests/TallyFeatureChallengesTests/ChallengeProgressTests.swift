import XCTest
import TallyFeatureAPIClient
@testable import TallyFeatureChallenges

final class ChallengeProgressTests: XCTestCase {
    private var calendar: Calendar {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(identifier: "Europe/London")!
        return calendar
    }
    private var challenge: Challenge {
        Challenge(id: "reading", userId: "test", name: "Reading", target: 500, timeframeType: .month, startDate: "2026-09-01", endDate: "2026-09-30", color: "#2563EB", icon: "book", isPublic: false, isArchived: false, createdAt: "", updatedAt: "")
    }
    private func day(_ day: Int) -> Date {
        calendar.date(from: DateComponents(year: 2026, month: 9, day: day, hour: 15))!
    }

    func testMidMonthGoalUsesTodayRatherThanItsCreationDate() {
        let stats = ChallengeProgress.updating(challenge: challenge, total: 25, today: day(8), calendar: calendar)
        XCTAssertEqual(stats.daysElapsed, 8)
        XCTAssertEqual(stats.daysRemaining, 22)
        XCTAssertEqual(stats.remaining, 475)
        XCTAssertEqual(stats.currentPace, 3.1)
        XCTAssertEqual(stats.perDayRequired, 21.6)
        XCTAssertEqual(stats.paceStatus, .behind)
    }

    func testCachedProgressAdvancesWithoutChangingTheTotal() {
        let cached = ChallengeProgress.updating(challenge: challenge, total: 25, today: day(8), calendar: calendar)
        let refreshed = ChallengeProgress.updating(challenge: challenge, total: cached.totalCount, previous: cached, today: day(9), calendar: calendar)
        XCTAssertEqual(refreshed.daysRemaining, 21)
        XCTAssertEqual(refreshed.daysElapsed, 9)
        XCTAssertEqual(refreshed.totalCount, 25)
    }

    func testCompletedAndFutureGoalsHaveSensiblePace() {
        let completed = ChallengeProgress.updating(challenge: challenge, total: 550, today: day(30), calendar: calendar)
        XCTAssertEqual(completed.daysRemaining, 0)
        XCTAssertEqual(completed.remaining, 0)
        XCTAssertEqual(completed.perDayRequired, 0)
        XCTAssertEqual(completed.paceStatus, .ahead)
        let future = ChallengeProgress.updating(challenge: challenge, total: 0, today: calendar.date(byAdding: .day, value: -1, to: day(1))!, calendar: calendar)
        XCTAssertEqual(future.daysElapsed, 0)
        XCTAssertEqual(future.daysRemaining, 30)
        XCTAssertEqual(future.paceStatus, .none)
    }
}
