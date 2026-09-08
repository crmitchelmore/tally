import Foundation
import TallyFeatureAPIClient

/// Calendar-day activity for the compact card chart. Date keys are local dates,
/// matching the dates entered by the user rather than shifting them through UTC.
enum RecentActivity {
    struct Day {
        let dateKey: String
        let count: Int
        let isFuture: Bool
    }

    static func days(entries: [Entry], weeks: Int, today: Date = Date(), calendar: Calendar = .current) -> [Day] {
        guard weeks > 0 else { return [] }
        let today = calendar.startOfDay(for: today)
        let weekdayOffset = (calendar.component(.weekday, from: today) - calendar.firstWeekday + 7) % 7
        let start = calendar.date(byAdding: .day, value: -weekdayOffset - (weeks - 1) * 7, to: today) ?? today
        let counts = entries.reduce(into: [String: Int]()) { $0[$1.date, default: 0] += $1.count }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.timeZone = calendar.timeZone
        formatter.dateFormat = "yyyy-MM-dd"
        return (0..<(weeks * 7)).map { offset in
            let date = calendar.date(byAdding: .day, value: offset, to: start) ?? today
            let key = formatter.string(from: date)
            return Day(dateKey: key, count: counts[key] ?? 0, isFuture: date > today)
        }
    }
}
