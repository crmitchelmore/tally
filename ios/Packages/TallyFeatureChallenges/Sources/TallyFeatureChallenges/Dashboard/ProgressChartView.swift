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
                Chart(chartData) { point in
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
