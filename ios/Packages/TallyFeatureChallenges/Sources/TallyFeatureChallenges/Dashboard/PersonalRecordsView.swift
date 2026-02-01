import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Personal records display
public struct PersonalRecordsView: View {
    let records: PersonalRecords
    
    public init(records: PersonalRecords) {
        self.records = records
    }
    
    public var body: some View {
        VStack(spacing: TallySpacing.md) {
            HStack {
                Text("Personal Records")
                    .font(.tallyTitleSmall)
                    .foregroundColor(Color.tallyInk)
                Spacer()
            }
            
            VStack(spacing: TallySpacing.sm) {
                if let bestDay = records.bestSingleDay {
                    RecordRow(
                        label: "Best Day",
                        value: "\(bestDay.count)",
                        subvalue: formattedDate(bestDay.date)
                    )
                }
                
                RecordRow(
                    label: "Longest Streak",
                    value: "\(records.longestStreak) days"
                )
                
                RecordRow(
                    label: "Active Days",
                    value: "\(records.mostActiveDays)"
                )
                
                if let highestAvg = records.highestDailyAverage {
                    RecordRow(
                        label: "Best Daily Avg",
                        value: String(format: "%.1f", highestAvg.average)
                    )
                }
                
                if let biggestEntry = records.biggestSingleEntry {
                    RecordRow(
                        label: "Biggest Entry",
                        value: "\(biggestEntry.count)"
                    )
                }

                if let bestSet = records.bestSet {
                    RecordRow(
                        label: "Best Set",
                        value: "\(bestSet.value)",
                        subvalue: formattedDate(bestSet.date)
                    )
                }

                if let avgSet = records.avgSetValue {
                    RecordRow(
                        label: "Avg Set",
                        value: String(format: "%.1f", avgSet)
                    )
                }
            }
            .padding(TallySpacing.md)
            .background(Color.tallyPaperTint)
            .cornerRadius(12)
        }
        .tallyPadding(.horizontal)
    }
}

struct RecordRow: View {
    let label: String
    let value: String
    let subvalue: String?
    
    init(label: String, value: String, subvalue: String? = nil) {
        self.label = label
        self.value = value
        self.subvalue = subvalue
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: TallySpacing.xs) {
            HStack {
                Text(label)
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkSecondary)
                
                Spacer()
                
                Text(value)
                    .font(.tallyMonoBody)
                    .foregroundColor(Color.tallyInk)
            }
            
            if let subvalue = subvalue {
                Text(subvalue)
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkTertiary)
            }
        }
        .padding(.vertical, TallySpacing.xs)
    }
}

private func formattedDate(_ isoString: String) -> String {
    let formatter = ISO8601DateFormatter()
    formatter.formatOptions = [.withFullDate]
    
    guard let date = formatter.date(from: isoString) else {
        return isoString
    }
    
    let displayFormatter = DateFormatter()
    displayFormatter.dateStyle = .medium
    return displayFormatter.string(from: date)
}

#Preview {
    PersonalRecordsView(
        records: PersonalRecords(
            bestSingleDay: PersonalRecords.BestDay(date: "2026-01-15", count: 50),
            longestStreak: 30,
            highestDailyAverage: PersonalRecords.HighestAverage(challengeId: "1", average: 15.5),
            mostActiveDays: 180,
            biggestSingleEntry: nil,
            bestSet: PersonalRecords.BestSet(value: 25, date: "2026-01-10", challengeId: "1"),
            avgSetValue: 12.5
        )
    )
}
