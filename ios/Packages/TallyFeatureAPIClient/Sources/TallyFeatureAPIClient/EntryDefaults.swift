import Foundation

/// Utilities for calculating smart initial values for new entries.
/// Uses the last 2 weeks of data to suggest starting values.
public enum EntryDefaults {
    
    /// Calculate initial value for a new entry based on recent history.
    ///
    /// - For simple count: returns the average count from the last 14 days, rounded to nearest 5.
    /// - For sets: returns the average of first-set values from the last 14 days, rounded.
    ///
    /// - Parameters:
    ///   - entries: All entries for the challenge
    ///   - countType: The challenge's count type
    /// - Returns: The suggested initial value (minimum 1)
    public static func calculateInitialValue(
        entries: [Entry],
        countType: CountType = .simple
    ) -> Int {
        let twoWeeksAgo = Calendar.current.date(byAdding: .day, value: -14, to: Date())!
        let cutoffDate = ISO8601DateFormatter.string(from: twoWeeksAgo, timeZone: .current, formatOptions: .withFullDate)
        
        let recentEntries = entries.filter { $0.date >= cutoffDate }
        
        guard !recentEntries.isEmpty else {
            return 1
        }
        
        if countType == .sets {
            // For sets mode: average of first-set values
            let firstSetValues = recentEntries
                .compactMap { $0.sets?.first }
            
            if firstSetValues.isEmpty {
                return calculateSimpleAverage(entries: recentEntries)
            }
            
            let avg = Double(firstSetValues.reduce(0, +)) / Double(firstSetValues.count)
            return max(1, Int(avg.rounded()))
        }
        
        return calculateSimpleAverage(entries: recentEntries)
    }
    
    /// Calculate simple average, rounded to nearest 5.
    private static func calculateSimpleAverage(entries: [Entry]) -> Int {
        guard !entries.isEmpty else { return 1 }
        
        let sum = entries.reduce(0) { $0 + $1.count }
        let avg = Double(sum) / Double(entries.count)
        
        // Round to nearest 5 for cleaner numbers
        let rounded = Int((avg / 5.0).rounded() * 5)
        return max(1, rounded != 0 ? rounded : Int(avg.rounded()))
    }
    
    /// Get the last set value for the "add another set" flow.
    ///
    /// - Parameter currentSets: The current sets array in the form
    /// - Returns: The last set value, or 1 if empty/invalid
    public static func getLastSetValue(currentSets: [Int]) -> Int {
        guard let last = currentSets.last, last > 0 else {
            return 1
        }
        return last
    }
    
    /// Calculate sets statistics for dashboard display.
    ///
    /// - Parameter entries: All entries (may include entries without sets)
    /// - Returns: Tuple with bestSet and avgSetValue, or nil values if no sets data
    public static func calculateSetsStats(
        entries: [Entry]
    ) -> (bestSet: (value: Int, date: String, entryId: String)?, avgSetValue: Double?) {
        // Collect all individual set values with metadata
        var allSets: [(value: Int, date: String, entryId: String)] = []
        
        for entry in entries {
            if let sets = entry.sets, !sets.isEmpty {
                for setVal in sets {
                    allSets.append((value: setVal, date: entry.date, entryId: entry.id))
                }
            }
        }
        
        guard !allSets.isEmpty else {
            return (nil, nil)
        }
        
        // Find best set
        let bestSet = allSets.max(by: { $0.value < $1.value })
        
        // Calculate average
        let sum = allSets.reduce(0) { $0 + $1.value }
        let avgSetValue = (Double(sum) / Double(allSets.count) * 10).rounded() / 10
        
        return (bestSet, avgSetValue)
    }
}

private extension ISO8601DateFormatter {
    static func string(from date: Date, timeZone: TimeZone, formatOptions: ISO8601DateFormatter.Options) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = formatOptions
        formatter.timeZone = timeZone
        return formatter.string(from: date)
    }
}
