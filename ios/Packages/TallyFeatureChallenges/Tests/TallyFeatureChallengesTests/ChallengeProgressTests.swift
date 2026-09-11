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

    private func entry(_ id: String, day: Int, count: Int) -> Entry {
        Entry(id: id, userId: "test", challengeId: challenge.id, date: String(format: "2026-09-%02d", day), count: count, createdAt: "", updatedAt: "")
    }

    func testFirstOfflineEntryUpdatesRecordsAndStreaks() {
        let cached = ChallengeProgress.updating(challenge: challenge, total: 0, today: day(8), calendar: calendar)
        let stats = ChallengeProgress.updating(challenge: challenge, total: 25, previous: cached, entries: [entry("one", day: 8, count: 25)], today: day(8), calendar: calendar)
        XCTAssertEqual(stats.bestDay, .init(date: "2026-09-08", count: 25))
        XCTAssertEqual(stats.streakCurrent, 1)
        XCTAssertEqual(stats.streakBest, 1)
        XCTAssertEqual(stats.dailyAverage, 25)
    }

    func testSameDayEntriesAggregateAndEditingHistoryChangesRecords() {
        let history = [entry("one", day: 6, count: 10), entry("two", day: 7, count: 20), entry("three", day: 7, count: 15), entry("four", day: 8, count: 5)]
        let stats = ChallengeProgress.updating(challenge: challenge, total: 50, entries: history, today: day(8), calendar: calendar)
        XCTAssertEqual(stats.bestDay, .init(date: "2026-09-07", count: 35))
        XCTAssertEqual(stats.streakCurrent, 3)
        XCTAssertEqual(stats.streakBest, 3)
        XCTAssertEqual(stats.dailyAverage, 16.7)
        let edited = ChallengeProgress.updating(challenge: challenge, total: 30, previous: stats, entries: [history[0], history[2], history[3]], today: day(8), calendar: calendar)
        XCTAssertEqual(edited.bestDay, .init(date: "2026-09-07", count: 15))
        XCTAssertEqual(edited.dailyAverage, 10)
        let empty = ChallengeProgress.updating(challenge: challenge, total: 0, previous: edited, entries: [], today: day(8), calendar: calendar)
        XCTAssertNil(empty.bestDay)
        XCTAssertEqual(empty.streakCurrent, 0)
        XCTAssertEqual(empty.streakBest, 0)
    }

    func testStreakAllowsYesterdayThenExpiresWithoutLosingBestRecord() {
        let history = [entry("one", day: 7, count: 10), entry("two", day: 8, count: 15)]
        let yesterday = ChallengeProgress.updating(challenge: challenge, total: 25, entries: history, today: day(9), calendar: calendar)
        XCTAssertEqual(yesterday.streakCurrent, 2)
        let expired = ChallengeProgress.updating(challenge: challenge, total: 25, previous: yesterday, entries: history, today: day(10), calendar: calendar)
        XCTAssertEqual(expired.streakCurrent, 0)
        XCTAssertEqual(expired.streakBest, 2)
        XCTAssertEqual(expired.bestDay?.count, 15)
    }

    func testPartialCacheDoesNotEraseServerRecords() {
        let complete = ChallengeProgress.updating(challenge: challenge, total: 25, entries: [entry("one", day: 7, count: 10), entry("two", day: 8, count: 15)], today: day(8), calendar: calendar)
        let partial = ChallengeProgress.updating(challenge: challenge, total: 30, previous: complete, entries: [entry("local", day: 8, count: 5)], today: day(8), calendar: calendar)
        XCTAssertEqual(partial.bestDay, complete.bestDay)
        XCTAssertEqual(partial.streakBest, complete.streakBest)
        XCTAssertEqual(partial.dailyAverage, complete.dailyAverage)
    }
}
