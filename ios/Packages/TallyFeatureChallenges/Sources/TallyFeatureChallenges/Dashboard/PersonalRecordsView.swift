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
                RecordRow(
                    icon: "flame.fill",
                    iconColor: .orange,
                    label: "Best Streak",
                    value: "\(records.longestStreak) days"
                )
                
                if let bestDay = records.bestSingleDay {
                    RecordRow(
                        icon: "star.fill",
                        iconColor: .yellow,
                        label: "Best Day",
                        value: "\(bestDay.count)"
                    )
                }
                
                RecordRow(
                    icon: "calendar",
                    iconColor: Color.tallyAccent,
                    label: "Most Active Days",
                    value: "\(records.mostActiveDays)"
                )
                
                if let highestAvg = records.highestDailyAverage {
                    RecordRow(
                        icon: "chart.line.uptrend.xyaxis",
                        iconColor: Color.tallySuccess,
                        label: "Highest Average",
                        value: String(format: "%.1f", highestAvg.average)
                    )
                }
                
                if let bestSet = records.bestSet {
                    RecordRow(
                        icon: "dumbbell.fill",
                        iconColor: Color.purple,
                        label: "Best Set",
                        value: "\(bestSet.value)"
                    )
                }
                
                if let avgSet = records.avgSetValue, avgSet > 0 {
                    RecordRow(
                        icon: "equal.circle.fill",
                        iconColor: Color.teal,
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
    let icon: String
    let iconColor: Color
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(iconColor)
                .frame(width: 24)
            
            Text(label)
                .font(.tallyBodyMedium)
                .foregroundColor(Color.tallyInk)
            
            Spacer()
            
            Text(value)
                .font(.tallyMonoBody)
                .foregroundColor(Color.tallyInkSecondary)
        }
        .padding(.vertical, TallySpacing.xs)
    }
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
