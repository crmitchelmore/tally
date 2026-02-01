import SwiftUI
import Charts
import TallyDesign
import TallyFeatureAPIClient

/// Progress line chart with challenge filtering
public struct ProgressChartView: View {
    let entries: [Entry]
    let challenges: [Challenge]
    let selectedChallengeId: String?
    
    @State private var selectedChallenge: String? = nil
    
    public init(
        entries: [Entry],
        challenges: [Challenge],
        selectedChallengeId: String? = nil
    ) {
        self.entries = entries
        self.challenges = challenges
        self.selectedChallengeId = selectedChallengeId
        self._selectedChallenge = State(initialValue: selectedChallengeId)
    }
    
    private var filteredEntries: [Entry] {
        if let id = selectedChallenge {
            return entries.filter { $0.challengeId == id }
        }
        return entries
    }
    
    private var chartData: [ChartDataPoint] {
        let calendar = Calendar.current
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        
        // Group entries by date
        var byDate: [String: Int] = [:]
        for entry in filteredEntries {
            byDate[entry.date, default: 0] += entry.count
        }
        
        // Create data points for last 30 days
        var points: [ChartDataPoint] = []
        let today = Date()
        
        for daysBack in (0..<30).reversed() {
            guard let date = calendar.date(byAdding: .day, value: -daysBack, to: today) else { continue }
            let dateStr = formatter.string(from: date)
            let count = byDate[dateStr] ?? 0
            points.append(ChartDataPoint(date: date, value: count))
        }
        
        return points
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: TallySpacing.md) {
            HStack {
                Text("Progress")
                    .font(.tallyTitleSmall)
                    .foregroundColor(Color.tallyInk)
                
                Spacer()
                
                // Challenge filter picker
                if challenges.count > 1 {
                    Menu {
                        Button("All Challenges") {
                            selectedChallenge = nil
                        }
                        
                        ForEach(challenges) { challenge in
                            Button(challenge.name) {
                                selectedChallenge = challenge.id
                            }
                        }
                    } label: {
                        HStack(spacing: 4) {
                            Text(selectedChallengeName)
                                .font(.tallyLabelSmall)
                            Image(systemName: "chevron.down")
                                .font(.caption2)
                        }
                        .foregroundColor(Color.tallyInkSecondary)
                    }
                }
            }
            
            if chartData.isEmpty || chartData.allSatisfy({ $0.value == 0 }) {
                // Empty state
                VStack(spacing: TallySpacing.sm) {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .font(.largeTitle)
                        .foregroundColor(Color.tallyInkTertiary)
                    Text("No data yet")
                        .font(.tallyLabelMedium)
                        .foregroundColor(Color.tallyInkSecondary)
                }
                .frame(maxWidth: .infinity)
                .frame(height: 200)
            } else {
                Chart {
                    if let targetDaily = targetDailyValue {
                        RuleMark(y: .value("Target", targetDaily))
                            .foregroundStyle(Color.tallyInkTertiary)
                            .lineStyle(StrokeStyle(lineWidth: 1, dash: [4, 4]))
                    }
                    
                    if let projectedDate = projectedFinishDate {
                        RuleMark(x: .value("Projected", projectedDate))
                            .foregroundStyle(Color.tallyAccent.opacity(0.4))
                            .lineStyle(StrokeStyle(lineWidth: 1, dash: [3, 3]))
                    }
                    
                    ForEach(chartData) { point in
                        LineMark(
                            x: .value("Date", point.date),
                            y: .value("Count", point.value)
                        )
                        .foregroundStyle(Color.tallyAccent)
                        .interpolationMethod(.catmullRom)
                        
                        AreaMark(
                            x: .value("Date", point.date),
                            y: .value("Count", point.value)
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
                .chartXAxis {
                    AxisMarks(values: .stride(by: .day, count: 7)) { value in
                        if let date = value.as(Date.self) {
                            AxisValueLabel {
                                Text(date, format: .dateTime.day().month(.abbreviated))
                                    .font(.tallyLabelSmall)
                            }
                        }
                    }
                }
                .chartYAxis {
                    AxisMarks(position: .leading)
                }
            }
            
            if let projectedDate = projectedFinishDate {
                HStack(spacing: TallySpacing.xs) {
                    Image(systemName: "flag.checkered")
                        .foregroundColor(Color.tallyInkSecondary)
                    Text("Projected finish: \(formatDate(projectedDate))")
                        .font(.tallyLabelSmall)
                        .foregroundColor(Color.tallyInkSecondary)
                }
            }
        }
        .padding(TallySpacing.md)
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
    }
    
    private var selectedChallengeName: String {
        if let id = selectedChallenge,
           let challenge = challenges.first(where: { $0.id == id }) {
            return challenge.name
        }
        return "All"
    }
    
    private var projectedFinishDate: Date? {
        guard let challenge = selectedChallengeModel else {
            return nil
        }
        let total = totalCountForSelected ?? 0
        if total <= 0 || total >= challenge.target { return nil }
        guard let startDate = dateFromISO(challenge.startDate) else { return nil }
        let today = Calendar.current.startOfDay(for: Date())
        let daysElapsed = max(1, Calendar.current.dateComponents([.day], from: startDate, to: today).day ?? 0)
        let pace = Double(total) / Double(daysElapsed)
        guard pace > 0 else { return nil }
        let remainingDays = Int(ceil(Double(challenge.target - total) / pace))
        return Calendar.current.date(byAdding: .day, value: remainingDays, to: today)
    }
    
    private func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
    
    private var selectedChallengeModel: Challenge? {
        guard let id = selectedChallenge else { return nil }
        return challenges.first(where: { $0.id == id })
    }
    
    private var totalCountForSelected: Int? {
        guard let id = selectedChallenge else { return nil }
        return entries.filter { $0.challengeId == id }.reduce(0) { $0 + $1.count }
    }
    
    private var targetDailyValue: Double? {
        guard let challenge = selectedChallengeModel,
              let endDate = dateFromISO(challenge.endDate) else {
            return nil
        }
        let today = Calendar.current.startOfDay(for: Date())
        let remaining = max(0, challenge.target - (totalCountForSelected ?? 0))
        let daysRemaining = Calendar.current.dateComponents([.day], from: today, to: endDate).day ?? 0
        guard remaining > 0, daysRemaining > 0 else { return nil }
        return Double(remaining) / Double(daysRemaining)
    }
    
    private func dateFromISO(_ value: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter.date(from: value)
    }

}

// MARK: - Data Model

struct ChartDataPoint: Identifiable {
    let id = UUID()
    let date: Date
    let value: Int
}

#Preview {
    ProgressChartView(
        entries: [],
        challenges: []
    )
    .padding()
}
