import Foundation
import TallyFeatureAPIClient

/// Refreshes calendar and pace fields while retaining the cached history statistics.
/// Uses the API's inclusive duration, daily pace, and five-percent pace tolerance.
enum ChallengeProgress {
    static func updating(challenge: Challenge, total: Int, previous: ChallengeStats? = nil, dailyAverage: Double? = nil, today: Date = Date(), calendar: Calendar = .current) -> ChallengeStats {
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
        return ChallengeStats(
            challengeId: challenge.id, totalCount: total, remaining: remaining,
            daysElapsed: elapsed, daysRemaining: daysLeft,
            perDayRequired: daysLeft > 0 ? ceil(Double(remaining) / Double(daysLeft) * 10) / 10 : 0,
            currentPace: (pace * 10).rounded() / 10, paceStatus: status,
            streakCurrent: previous?.streakCurrent ?? 0, streakBest: previous?.streakBest ?? 0,
            bestDay: previous?.bestDay, dailyAverage: dailyAverage ?? previous?.dailyAverage ?? 0
        )
    }
}
