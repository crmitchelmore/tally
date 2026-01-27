import SwiftUI
import Charts
import TallyDesign
import TallyFeatureAPIClient

/// Burn-up chart showing progress over challenge duration with pace projection
public struct BurnUpChartView: View {
    let challenge: Challenge
    let stats: ChallengeStats
    let entries: [Entry]
    
    public init(challenge: Challenge, stats: ChallengeStats, entries: [Entry]) {
        self.challenge = challenge
        self.stats = stats
        self.entries = entries
    }
    
    // Chart data points
    private var chartData: ChartData {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        
        guard let startDate = formatter.date(from: challenge.startDate),
              let endDate = formatter.date(from: challenge.endDate) else {
            return ChartData(actual: [], target: [], projected: [])
        }
        
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        // Build cumulative actual progress from entries
        var cumulativeByDate: [Date: Int] = [:]
        var runningTotal = 0
        
        // Group entries by date and sum
        let entriesByDate = Dictionary(grouping: entries) { entry -> Date in
            formatter.date(from: entry.date) ?? today
        }
        
        // Walk through each day from start to today
        var currentDate = startDate
        while currentDate <= min(today, endDate) {
            let dayEntries = entriesByDate[currentDate] ?? []
            runningTotal += dayEntries.reduce(0) { $0 + $1.count }
            cumulativeByDate[currentDate] = runningTotal
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate) ?? currentDate
        }
        
        // Build actual data points (start to today)
        var actualPoints: [ChartPoint] = []
        currentDate = startDate
        var lastValue = 0
        while currentDate <= min(today, endDate) {
            lastValue = cumulativeByDate[currentDate] ?? lastValue
            actualPoints.append(ChartPoint(date: currentDate, value: lastValue))
            currentDate = calendar.date(byAdding: .day, value: 1, to: currentDate) ?? currentDate
        }
        
        // Build target line (straight line from 0 to target)
        let targetPoints: [ChartPoint] = [
            ChartPoint(date: startDate, value: 0),
            ChartPoint(date: endDate, value: challenge.target)
        ]
        
        // Build projected line (from current point to end date at current pace)
        var projectedPoints: [ChartPoint] = []
        if stats.currentPace > 0 && today < endDate {
            let daysRemaining = calendar.dateComponents([.day], from: today, to: endDate).day ?? 0
            let projectedEnd = stats.totalCount + Int(stats.currentPace * Double(daysRemaining))
            
            projectedPoints = [
                ChartPoint(date: today, value: stats.totalCount),
                ChartPoint(date: endDate, value: projectedEnd)
            ]
        }
        
        return ChartData(actual: actualPoints, target: targetPoints, projected: projectedPoints)
    }
    
    private var challengeColor: Color {
        Color(hex: challenge.color) ?? Color.tallyAccent
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: TallySpacing.sm) {
            // Header
            Text("Progress")
                .font(.tallyTitleSmall)
                .foregroundColor(Color.tallyInk)
            
            // Chart
            Chart {
                // Target line (dashed, light)
                ForEach(chartData.target, id: \.date) { point in
                    LineMark(
                        x: .value("Date", point.date),
                        y: .value("Count", point.value),
                        series: .value("Type", "Target")
                    )
                    .foregroundStyle(Color.tallyInkTertiary)
                    .lineStyle(StrokeStyle(lineWidth: 2, dash: [6, 4]))
                }
                
                // Projected line (dashed, accent)
                ForEach(chartData.projected, id: \.date) { point in
                    LineMark(
                        x: .value("Date", point.date),
                        y: .value("Count", point.value),
                        series: .value("Type", "Projected")
                    )
                    .foregroundStyle(challengeColor.opacity(0.5))
                    .lineStyle(StrokeStyle(lineWidth: 2, dash: [4, 4]))
                }
                
                // Actual progress line (solid)
                ForEach(chartData.actual, id: \.date) { point in
                    LineMark(
                        x: .value("Date", point.date),
                        y: .value("Count", point.value),
                        series: .value("Type", "Actual")
                    )
                    .foregroundStyle(challengeColor)
                    .lineStyle(StrokeStyle(lineWidth: 3))
                }
                
                // Current position marker
                if let lastActual = chartData.actual.last {
                    PointMark(
                        x: .value("Date", lastActual.date),
                        y: .value("Count", lastActual.value)
                    )
                    .foregroundStyle(challengeColor)
                    .symbolSize(60)
                }
                
                // Target marker
                if let endPoint = chartData.target.last {
                    PointMark(
                        x: .value("Date", endPoint.date),
                        y: .value("Count", endPoint.value)
                    )
                    .foregroundStyle(Color.tallyInkSecondary)
                    .symbolSize(40)
                    .symbol(.diamond)
                }
            }
            .chartYScale(domain: 0...(max(challenge.target, stats.totalCount) + 10))
            .chartXAxis {
                AxisMarks(values: .stride(by: .month)) { value in
                    AxisGridLine()
                    AxisValueLabel(format: .dateTime.month(.abbreviated))
                }
            }
            .chartYAxis {
                AxisMarks(position: .leading)
            }
            .frame(height: 200)
            
            // Legend
            HStack(spacing: TallySpacing.md) {
                LegendItem(color: challengeColor, label: "Progress", isDashed: false)
                LegendItem(color: Color.tallyInkTertiary, label: "Target pace", isDashed: true)
                if !chartData.projected.isEmpty {
                    LegendItem(color: challengeColor.opacity(0.5), label: "Projected", isDashed: true)
                }
            }
            .font(.tallyLabelSmall)
            
            // Projection callout
            if let projectedEnd = chartData.projected.last {
                let willHitTarget = projectedEnd.value >= challenge.target
                HStack(spacing: TallySpacing.xs) {
                    Image(systemName: willHitTarget ? "checkmark.circle.fill" : "exclamationmark.circle.fill")
                        .foregroundColor(willHitTarget ? Color.tallySuccess : Color.tallyWarning)
                    
                    Text(willHitTarget 
                        ? "On track to reach \(challenge.target) by end date"
                        : "At current pace, you'll reach \(projectedEnd.value) by end date")
                        .font(.tallyLabelSmall)
                        .foregroundColor(Color.tallyInkSecondary)
                }
                .padding(.top, TallySpacing.xs)
            }
        }
        .tallyPadding()
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
    }
}

// MARK: - Data Models

private struct ChartData {
    let actual: [ChartPoint]
    let target: [ChartPoint]
    let projected: [ChartPoint]
}

private struct ChartPoint: Identifiable {
    let date: Date
    let value: Int
    var id: Date { date }
}

// MARK: - Legend Item

private struct LegendItem: View {
    let color: Color
    let label: String
    let isDashed: Bool
    
    var body: some View {
        HStack(spacing: 4) {
            if isDashed {
                // Dashed line
                HStack(spacing: 2) {
                    ForEach(0..<3, id: \.self) { _ in
                        Rectangle()
                            .fill(color)
                            .frame(width: 4, height: 2)
                    }
                }
            } else {
                Rectangle()
                    .fill(color)
                    .frame(width: 12, height: 3)
                    .cornerRadius(1.5)
            }
            Text(label)
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
            totalCount: 8,
            remaining: 92,
            daysElapsed: 27,
            daysRemaining: 338,
            perDayRequired: 0.27,
            currentPace: 0.30,
            paceStatus: .ahead,
            streakCurrent: 5,
            streakBest: 7,
            bestDay: nil,
            dailyAverage: 0.30
        ),
        entries: []
    )
    .padding()
}
