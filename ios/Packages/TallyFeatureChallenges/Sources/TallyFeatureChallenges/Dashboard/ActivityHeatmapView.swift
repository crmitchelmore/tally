import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// GitHub-style activity heatmap
public struct ActivityHeatmapView: View {
    let entries: [Entry]
    let startDate: String?
    let endDate: String?
    let colorHex: String?
    let onDayTap: ((String) -> Void)?
    
    // Computed properties for heatmap
    private let calendar = Calendar.current
    private let weeksToShow = 26 // ~6 months
    private let daysInWeek = 7
    
    public init(
        entries: [Entry],
        startDate: String? = nil,
        endDate: String? = nil,
        colorHex: String? = nil,
        onDayTap: ((String) -> Void)? = nil
    ) {
        self.entries = entries
        self.startDate = startDate
        self.endDate = endDate
        self.colorHex = colorHex
        self.onDayTap = onDayTap
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
            
            // Heatmap grid with month labels inside ScrollView
            ScrollView(.horizontal, showsIndicators: false) {
                VStack(alignment: .leading, spacing: 4) {
                    // Heatmap grid
                    HStack(spacing: 3) {
                        ForEach(0..<weeksToShow, id: \.self) { weekIndex in
                            VStack(spacing: 3) {
                                ForEach(0..<daysInWeek, id: \.self) { dayIndex in
                                    let date = dateFor(weekIndex: weekIndex, dayIndex: dayIndex)
                                    let count = countFor(date: date)
                                    
                                    Button {
                                        if count > 0 {
                                            let formatter = ISO8601DateFormatter()
                                            formatter.formatOptions = [.withFullDate]
                                            onDayTap?(formatter.string(from: date))
                                        }
                                    } label: {
                                        RoundedRectangle(cornerRadius: 2)
                                            .fill(heatmapColor(for: count))
                                            .frame(width: 10, height: 10)
                                    }
                                    .buttonStyle(.plain)
                                    .disabled(count == 0 || onDayTap == nil)
                                }
                            }
                        }
                    }
                    
                    // Month labels (now inside ScrollView)
                    HStack(spacing: 0) {
                        ForEach(monthLabels, id: \.self) { label in
                            Text(label)
                                .font(.tallyLabelSmall)
                                .foregroundColor(Color.tallyInkTertiary)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
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
        let start = resolvedStartDate ?? calendar.date(byAdding: .month, value: -6, to: today) ?? today
        let weekday = calendar.component(.weekday, from: start)
        let offsetToSunday = weekday == 1 ? 0 : -(weekday - 1)
        let gridStart = calendar.date(byAdding: .day, value: offsetToSunday, to: start) ?? start
        let daysForward = weekIndex * 7 + dayIndex
        return calendar.date(byAdding: .day, value: daysForward, to: gridStart) ?? today
    }
    
    private func countFor(date: Date) -> Int {
        if let start = resolvedStartDate, date < start {
            return 0
        }
        if let end = resolvedEndDate, date > end {
            return 0
        }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let dateString = formatter.string(from: date)
        return entriesByDate[dateString] ?? 0
    }
    
    private func heatmapColor(for count: Int) -> Color {
        let base = Color(hex: colorHex ?? "") ?? Color.tallySuccess
        switch count {
        case 0: return Color.tallyPaper.opacity(0.5)
        case 1...5: return base.opacity(0.3)
        case 6...15: return base.opacity(0.5)
        case 16...30: return base.opacity(0.7)
        default: return base
        }
    }
    
    private func heatmapColorForLevel(_ level: Int) -> Color {
        let base = Color(hex: colorHex ?? "") ?? Color.tallySuccess
        switch level {
        case 0: return Color.tallyPaper.opacity(0.5)
        case 1: return base.opacity(0.3)
        case 2: return base.opacity(0.5)
        case 3: return base.opacity(0.7)
        default: return base
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
    
    private var resolvedStartDate: Date? {
        guard let startDate else { return nil }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter.date(from: startDate)
    }

    private var resolvedEndDate: Date? {
        guard let endDate else { return nil }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter.date(from: endDate)
    }
}

#Preview {
    ActivityHeatmapView(entries: [])
        .padding()
}
