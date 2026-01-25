import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// GitHub-style activity heatmap
public struct ActivityHeatmapView: View {
    let entries: [Entry]
    
    // Computed properties for heatmap
    private let calendar = Calendar.current
    private let weeksToShow = 26 // ~6 months
    private let daysInWeek = 7
    
    public init(entries: [Entry]) {
        self.entries = entries
    }
    
    public var body: some View {
        VStack(alignment: .leading, spacing: TallySpacing.md) {
            HStack {
                Text("Activity")
                    .font(.tallyTitleSmall)
                    .foregroundColor(Color.tallyInk)
                Spacer()
            }
            
            // Legend
            HStack(spacing: TallySpacing.xs) {
                Text("Less")
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkTertiary)
                
                ForEach(0..<5) { level in
                    RoundedRectangle(cornerRadius: 2)
                        .fill(heatmapColorForLevel(level))
                        .frame(width: 10, height: 10)
                }
                
                Text("More")
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkTertiary)
                
                Spacer()
            }
            
            // Heatmap grid
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 3) {
                    ForEach(0..<weeksToShow, id: \.self) { weekIndex in
                        VStack(spacing: 3) {
                            ForEach(0..<daysInWeek, id: \.self) { dayIndex in
                                let date = dateFor(weekIndex: weekIndex, dayIndex: dayIndex)
                                let count = countFor(date: date)
                                
                                RoundedRectangle(cornerRadius: 2)
                                    .fill(heatmapColor(for: count))
                                    .frame(width: 10, height: 10)
                            }
                        }
                    }
                }
            }
            
            // Month labels
            HStack(spacing: 0) {
                ForEach(monthLabels, id: \.self) { label in
                    Text(label)
                        .font(.tallyLabelSmall)
                        .foregroundColor(Color.tallyInkTertiary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                }
            }
        }
        .padding(TallySpacing.md)
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
    }
    
    // MARK: - Helpers
    
    private var entriesByDate: [String: Int] {
        var dict: [String: Int] = [:]
        for entry in entries {
            dict[entry.date, default: 0] += entry.count
        }
        return dict
    }
    
    private func dateFor(weekIndex: Int, dayIndex: Int) -> Date {
        let today = Date()
        let daysBack = (weeksToShow - 1 - weekIndex) * 7 + (6 - dayIndex)
        return calendar.date(byAdding: .day, value: -daysBack, to: today) ?? today
    }
    
    private func countFor(date: Date) -> Int {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let dateString = formatter.string(from: date)
        return entriesByDate[dateString] ?? 0
    }
    
    private func heatmapColor(for count: Int) -> Color {
        switch count {
        case 0: return Color.tallyPaper.opacity(0.5)
        case 1...5: return Color.tallySuccess.opacity(0.3)
        case 6...15: return Color.tallySuccess.opacity(0.5)
        case 16...30: return Color.tallySuccess.opacity(0.7)
        default: return Color.tallySuccess
        }
    }
    
    private func heatmapColorForLevel(_ level: Int) -> Color {
        switch level {
        case 0: return Color.tallyPaper.opacity(0.5)
        case 1: return Color.tallySuccess.opacity(0.3)
        case 2: return Color.tallySuccess.opacity(0.5)
        case 3: return Color.tallySuccess.opacity(0.7)
        default: return Color.tallySuccess
        }
    }
    
    private var monthLabels: [String] {
        var labels: [String] = []
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM"
        
        var currentMonth: Int = -1
        for weekIndex in 0..<weeksToShow {
            let date = dateFor(weekIndex: weekIndex, dayIndex: 0)
            let month = calendar.component(.month, from: date)
            
            if month != currentMonth {
                labels.append(formatter.string(from: date))
                currentMonth = month
            }
        }
        
        return labels
    }
}

#Preview {
    ActivityHeatmapView(entries: [])
        .padding()
}
