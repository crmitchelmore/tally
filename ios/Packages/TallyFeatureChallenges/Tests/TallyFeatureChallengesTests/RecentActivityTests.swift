import XCTest
import TallyFeatureAPIClient
@testable import TallyFeatureChallenges

final class RecentActivityTests: XCTestCase {
    func testCurrentWeekIncludesTodayAndCombinesEntries() {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0)!
        calendar.firstWeekday = 2
        let today = calendar.date(from: DateComponents(year: 2026, month: 9, day: 8))!
        let days = RecentActivity.days(entries: [entry("2026-09-08", 20), entry("2026-09-08", 5)], weeks: 8, today: today, calendar: calendar)
        XCTAssertEqual(days.count, 56)
        XCTAssertEqual(days.first?.dateKey, "2026-07-20")
        XCTAssertEqual(days.last?.dateKey, "2026-09-13")
        XCTAssertEqual(days.first { $0.dateKey == "2026-09-08" }?.count, 25)
        XCTAssertEqual(days.first { $0.dateKey == "2026-09-08" }?.isFuture, false)
        XCTAssertEqual(days.filter(\.isFuture).count, 5)
    }

    func testLocalDayIsPreservedAcrossTimezonesAndDaylightSaving() {
        for zone in ["Pacific/Auckland", "America/Los_Angeles", "Europe/London"] {
            var calendar = Calendar(identifier: .gregorian)
            calendar.timeZone = TimeZone(identifier: zone)!
            calendar.firstWeekday = 1
            let today = calendar.date(from: DateComponents(year: 2026, month: 3, day: 29, hour: 23))!
            let days = RecentActivity.days(entries: [entry("2026-03-29", 7)], weeks: 8, today: today, calendar: calendar)
            XCTAssertEqual(Set(days.map(\.dateKey)).count, 56, zone)
            XCTAssertEqual(days.first { $0.dateKey == "2026-03-29" }?.count, 7, zone)
            XCTAssertEqual(days.first { $0.dateKey == "2026-03-29" }?.isFuture, false, zone)
            XCTAssertEqual(days.filter(\.isFuture).count, 6, zone)
        }
    }

    private func entry(_ date: String, _ count: Int) -> Entry {
        Entry(id: UUID().uuidString, userId: "test", challengeId: "test", date: date, count: count, createdAt: "", updatedAt: "")
    }
}
