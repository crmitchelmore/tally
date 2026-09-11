import Foundation
import TallyFeatureAPIClient

/// Refreshes progress and derives records when the complete entry history is available.
/// Uses the API's inclusive duration, daily pace, and five-percent pace tolerance.
enum ChallengeProgress {
    static func updating(challenge: Challenge, total: Int, previous: ChallengeStats? = nil, dailyAverage: Double? = nil, entries: [Entry]? = nil, today: Date = Date(), calendar: Calendar = .current) -> ChallengeStats {
        let formatter = CalendarDay.formatter(timeZone: calendar.timeZone)
        let today = calendar.startOfDay(for: today)
        let start = formatter.date(from: challenge.startDate) ?? today
        let end = formatter.date(from: challenge.endDate) ?? today
        let duration = max(1, (calendar.dateComponents([.day], from: start, to: end).day ?? 0) + 1)
        let elapsed = max(0, (calendar.dateComponents([.day], from: start, to: today).day ?? 0) + 1)
        let daysLeft = max(0, duration - elapsed)
        let remaining = max(0, challenge.target - total)
        let expected = Double(challenge.target) / Double(duration) * Double(elapsed)
        let pace = elapsed > 0 ? Double(total) / Double(elapsed) : 0
        let status: PaceStatus
        if elapsed == 0 { status = .none }
        else if total >= challenge.target || Double(total) > expected * 1.05 { status = .ahead }
        else if Double(total) < expected * 0.95 { status = .behind }
        else { status = .onPace }
        var streakCurrent = previous?.streakCurrent ?? 0
        var streakBest = previous?.streakBest ?? 0
        var bestDay = previous?.bestDay
        var average = dailyAverage ?? previous?.dailyAverage ?? 0
        if let entries, entries.reduce(0, { $0 + $1.count }) == total {
            let dailyCounts = Dictionary(grouping: entries, by: \.date).mapValues { $0.reduce(0, { $0 + $1.count }) }
            let dates = dailyCounts.keys.compactMap { formatter.date(from: $0) }.sorted()
            var run = 0
            var priorDate: Date?
            streakBest = 0
            for date in dates {
                if let priorDate, calendar.dateComponents([.day], from: priorDate, to: date).day == 1 {
                    run += 1
                } else {
                    run = 1
                }
                streakBest = max(streakBest, run)
                priorDate = date
            }
            streakCurrent = 0
            var cursor = dailyCounts[formatter.string(from: today)] != nil ? today : calendar.date(byAdding: .day, value: -1, to: today)!
            while dailyCounts[formatter.string(from: cursor)] != nil {
                streakCurrent += 1
                cursor = calendar.date(byAdding: .day, value: -1, to: cursor)!
            }
            bestDay = nil
            for (date, count) in dailyCounts.sorted(by: { $0.key < $1.key }) {
                if bestDay.map({ count > $0.count }) ?? true {
                    bestDay = .init(date: date, count: count)
                }
            }
            average = dailyCounts.isEmpty ? 0 : (Double(total) / Double(dailyCounts.count) * 10).rounded() / 10
        }
        return ChallengeStats(
            challengeId: challenge.id, totalCount: total, remaining: remaining,
            daysElapsed: elapsed, daysRemaining: daysLeft,
            perDayRequired: daysLeft > 0 ? ceil(Double(remaining) / Double(daysLeft) * 10) / 10 : 0,
            currentPace: (pace * 10).rounded() / 10, paceStatus: status,
            streakCurrent: streakCurrent, streakBest: streakBest,
            bestDay: bestDay, dailyAverage: average
        )
    }
}
