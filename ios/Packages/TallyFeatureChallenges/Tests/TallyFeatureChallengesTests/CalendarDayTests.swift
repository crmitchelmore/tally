import XCTest
@testable import TallyFeatureChallenges

final class CalendarDayTests: XCTestCase {
    func testSelectedMonthBoundariesDoNotShiftThroughUTC() {
        for zone in ["Europe/London", "Pacific/Auckland", "America/Los_Angeles"] {
            var calendar = Calendar(identifier: .gregorian)
            calendar.timeZone = TimeZone(identifier: zone)!
            let formatter = CalendarDay.formatter(timeZone: calendar.timeZone)
            for day in [1, 30] {
                let midnight = calendar.date(from: DateComponents(year: 2026, month: 9, day: day))!
                let key = "2026-09-\(String(format: "%02d", day))"
                XCTAssertEqual(formatter.string(from: midnight), key, zone)
                XCTAssertEqual(formatter.date(from: key), midnight, zone)
            }
        }
    }
}
