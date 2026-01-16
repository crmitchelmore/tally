import Foundation

/// Statistics utilities for challenges - mirrors web stats.ts logic
struct Stats {
    
    // MARK: - Types
    
    struct ChallengeStats {
        let totalEntries: Int
        let totalCount: Int
        let streak: Int
        let averagePerDay: Double
        let daysActive: Int
        let bestDay: DayStat?
        let percentComplete: Double
    }
    
    struct DayStat {
        let date: Date
        let count: Int
    }
    
    // MARK: - Calculations
    
    /// Calculate comprehensive stats for a challenge
    static func calculateStats(
        entries: [EntryResponse],
        target: Int,
        startDate: Date,
        endDate: Date?
    ) -> ChallengeStats {
        guard !entries.isEmpty else {
            return ChallengeStats(
                totalEntries: 0,
                totalCount: 0,
                streak: 0,
                averagePerDay: 0,
                daysActive: 0,
                bestDay: nil,
                percentComplete: 0
            )
        }
        
        let totalCount = entries.reduce(0) { $0 + $1.count }
        let percentComplete = target > 0 ? min(Double(totalCount) / Double(target) * 100, 100) : 0
        
        // Group by day
        let calendar = Calendar.current
        var entriesByDay: [Date: Int] = [:]
        
        for entry in entries {
            let entryDate = Date(timeIntervalSince1970: entry.createdAt / 1000)
            let dayStart = calendar.startOfDay(for: entryDate)
            entriesByDay[dayStart, default: 0] += entry.count
        }
        
        // Calculate streak
        let streak = calculateStreak(entriesByDay: entriesByDay)
        
        // Find best day
        let bestDay = entriesByDay.max { $0.value < $1.value }.map { DayStat(date: $0.key, count: $0.value) }
        
        // Calculate days active and average
        let daysActive = entriesByDay.count
        let daysSinceStart = max(1, calendar.dateComponents([.day], from: startDate, to: Date()).day ?? 1)
        let averagePerDay = Double(totalCount) / Double(daysSinceStart)
        
        return ChallengeStats(
            totalEntries: entries.count,
            totalCount: totalCount,
            streak: streak,
            averagePerDay: averagePerDay,
            daysActive: daysActive,
            bestDay: bestDay,
            percentComplete: percentComplete
        )
    }
    
    /// Calculate current streak (consecutive days with entries)
    static func calculateStreak(entriesByDay: [Date: Int]) -> Int {
        guard !entriesByDay.isEmpty else { return 0 }
        
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let sortedDays = entriesByDay.keys.sorted(by: >)
        
        var streak = 0
        var currentDate = today
        
        // Allow starting from yesterday if no entries today
        if !sortedDays.contains(today) {
            currentDate = calendar.date(byAdding: .day, value: -1, to: today) ?? today
        }
        
        for day in sortedDays {
            if calendar.isDate(day, inSameDayAs: currentDate) {
                streak += 1
                currentDate = calendar.date(byAdding: .day, value: -1, to: currentDate) ?? currentDate
            } else if day < currentDate {
                break
            }
        }
        
        return streak
    }
    
    /// Calculate projected completion date based on current pace
    static func projectedCompletion(
        currentCount: Int,
        target: Int,
        averagePerDay: Double
    ) -> Date? {
        guard currentCount < target && averagePerDay > 0 else { return nil }
        
        let remaining = Double(target - currentCount)
        let daysNeeded = Int(ceil(remaining / averagePerDay))
        
        return Calendar.current.date(byAdding: .day, value: daysNeeded, to: Date())
    }
    
    /// Format pace comparison (ahead/behind target)
    static func paceDescription(
        currentCount: Int,
        target: Int,
        startDate: Date,
        endDate: Date?
    ) -> String {
        guard let endDate = endDate, target > 0 else {
            return "No deadline"
        }
        
        let calendar = Calendar.current
        let totalDays = max(1, calendar.dateComponents([.day], from: startDate, to: endDate).day ?? 1)
        let daysElapsed = max(1, calendar.dateComponents([.day], from: startDate, to: Date()).day ?? 1)
        
        let expectedCount = Double(target) * (Double(daysElapsed) / Double(totalDays))
        let diff = Double(currentCount) - expectedCount
        
        if abs(diff) < 1 {
            return "On track"
        } else if diff > 0 {
            return "\(Int(diff)) ahead"
        } else {
            return "\(Int(abs(diff))) behind"
        }
    }
}
