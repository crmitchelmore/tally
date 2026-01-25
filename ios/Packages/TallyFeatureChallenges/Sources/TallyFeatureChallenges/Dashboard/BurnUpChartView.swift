import SwiftUI
import Charts
import TallyDesign
import TallyFeatureAPIClient

/// Burn-up chart showing progress towards goal
public struct BurnUpChartView: View {
    let challenge: Challenge
    let stats: ChallengeStats
    let entries: [Entry]
    
    public init(challenge: Challenge, stats: ChallengeStats, entries: [Entry]) {
        self.challenge = challenge
        self.stats = stats
        self.entries = entries
    }
    
    private var burnUpData: [BurnUpPoint] {
        let calendar = Calendar.current
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        
        guard let startDate = formatter.date(from: challenge.startDate),
              let endDate = formatter.date(from: challenge.endDate) else {
            return []
        }
        
        // Sort entries by date
        let sortedEntries = entries.sorted { $0.date < $1.date }
        
        // Build cumulative progress
        var points: [BurnUpPoint] = []
        var cumulative = 0
        var entryIndex = 0
        
        var currentDate = startDate
        let today = Date()
        
        while currentDate <= min(today, endDate) {
            let dateStr = formatter.string(from: currentDate)
            
            // Add all entries for this date
            while entryIndex < sortedEntries.count && sortedEntries[entryIndex].date == dateStr {
                cumulative += sortedEntries[entryIndex].count
                entryIndex += 1
            }
            
            // Calculate expected progress for this date
            let totalDays = calendar.dateComponents([.day], from: startDate, to: endDate).day ?? 1
            let daysElapsed = calendar.dateComponents([.day], from: startDate, to: currentDate).day ?? 0
            let expectedProgress = (Double(challenge.target) / Double(totalDays)) * Double(daysElapsed)
            
            points.append(BurnUpPoint(
                date: currentDate,
                actual: cumulative,
                expected: Int(expectedProgress),
                target: challenge.target
            ))
            
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate) ?? currentDate
        }
        
        return points
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: TallySpacing.md) {
            HStack {
                Text("Burn Up: \(challenge.name)")
                    .font(.tallyTitleSmall)
                    .foregroundColor(Color.tallyInk)
                    .lineLimit(1)
                
                Spacer()
                
                // Progress percentage
                Text("\(Int(Double(stats.totalCount) / Double(challenge.target) * 100))%")
                    .font(.tallyLabelMedium)
                    .foregroundColor(Color.tallyAccent)
            }
            
            if burnUpData.isEmpty {
                // Empty state
                VStack(spacing: TallySpacing.sm) {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .font(.largeTitle)
                        .foregroundColor(Color.tallyInkTertiary)
                    Text("Start adding entries to see progress")
                        .font(.tallyLabelMedium)
                        .foregroundColor(Color.tallyInkSecondary)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 200)
            } else {
                Chart {
                    // Target line (horizontal)
                    RuleMark(y: .value("Target", challenge.target))
                        .foregroundStyle(Color.tallySuccess.opacity(0.5))
                        .lineStyle(StrokeStyle(lineWidth: 2, dash: [5, 5]))
                    
                    // Expected progress line
                    ForEach(burnUpData) { point in
                        LineMark(
                            x: .value("Date", point.date),
                            y: .value("Expected", point.expected)
                        )
                        .foregroundStyle(Color.tallyInkTertiary)
                        .lineStyle(StrokeStyle(lineWidth: 1, dash: [3, 3]))
                    }
                    
                    // Actual progress line
                    ForEach(burnUpData) { point in
                        LineMark(
                            x: .value("Date", point.date),
                            y: .value("Actual", point.actual)
                        )
                        .foregroundStyle(Color.tallyAccent)
                        .interpolationMethod(.catmullRom)
                    }
                    
                    // Actual progress area
                    ForEach(burnUpData) { point in
                        AreaMark(
                            x: .value("Date", point.date),
                            y: .value("Actual", point.actual)
                        )
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color.tallyAccent.opacity(0.3), Color.tallyAccent.opacity(0.05)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                        .interpolationMethod(.catmullRom)
                    }
                }
                .frame(height: 200)
                .chartYScale(domain: 0...challenge.target)
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day, count: 30)) { value in
                        if let date = value.as(Date.self) {
                            AxisValueLabel {
                                Text(date, format: .dateTime.month(.abbreviated))
                                    .font(.tallyLabelSmall)
                            }
                        }
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading) { value in
                        AxisValueLabel {
                            if let intValue = value.as(Int.self) {
                                Text("\(intValue)")
                                    .font(.tallyLabelSmall)
                            }
                        }
                        AxisGridLine()
                    }
                }
            }
            
            // Legend
            HStack(spacing: TallySpacing.lg) {
                LegendItem(color: Color.tallyAccent, label: "Actual")
                LegendItem(color: Color.tallyInkTertiary, label: "Expected", dashed: true)
                LegendItem(color: Color.tallySuccess, label: "Target", dashed: true)
            }
        }
        .padding(TallySpacing.md)
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
    }
}

// MARK: - Data Model

struct BurnUpPoint: Identifiable {
    let id = UUID()
    let date: Date
    let actual: Int
    let expected: Int
    let target: Int
}

struct LegendItem: View {
    let color: Color
    let label: String
    var dashed: Bool = false
    
    var body: some View {
        HStack(spacing: 4) {
            if dashed {
                Rectangle()
                    .stroke(color, style: StrokeStyle(lineWidth: 2, dash: [4, 4]))
                    .frame(width: 16, height: 2)
            } else {
                Rectangle()
                    .fill(color)
                    .frame(width: 16, height: 2)
            }
            
            Text(label)
                .font(.tallyLabelSmall)
                .foregroundColor(Color.tallyInkSecondary)
        }
    }
}

#Preview {
    BurnUpChartView(
        challenge: Challenge(
            id: "1",
            userId: "user1",
            name: "Read 100 Books",
            target: 100,
            timeframeType: .year,
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            color: "#D94343",
            icon: "book.fill",
            isPublic: false,
            isArchived: false,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z"
        ),
        stats: ChallengeStats(
            challengeId: "1",
            totalCount: 25,
            remaining: 75,
            daysElapsed: 30,
            daysRemaining: 335,
            perDayRequired: 0.22,
            currentPace: 0.83,
            paceStatus: .ahead,
            streakCurrent: 5,
            streakBest: 10,
            bestDay: nil,
            dailyAverage: 0.83
        ),
        entries: []
    )
    .padding()
}
