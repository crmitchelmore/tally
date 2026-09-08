import Foundation

/// Challenge boundaries and entry keys describe calendar days, not UTC instants.
enum CalendarDay {
    static func formatter(timeZone: TimeZone = .autoupdatingCurrent) -> ISO8601DateFormatter {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        formatter.timeZone = timeZone
        return formatter
    }
}
