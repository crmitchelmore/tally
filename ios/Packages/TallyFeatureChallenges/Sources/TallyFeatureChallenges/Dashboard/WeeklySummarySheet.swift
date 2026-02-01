import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Weekly summary sheet showing marks logged, days active, and breakdowns.
public struct WeeklySummarySheet: View {
    let entries: [Entry]
    let challengesById: [String: Challenge]
    let onClose: () -> Void
    
    @State private var weekOffset: Int = 0
    
    public init(
        entries: [Entry],
        challengesById: [String: Challenge],
        onClose: @escaping () -> Void
    ) {
        self.entries = entries
        self.challengesById = challengesById
        self.onClose = onClose
    }
    
    public var body: some View {
        NavigationStack {
            VStack(spacing: TallySpacing.lg) {
                weekHeader
                statsRow
                tallyPreview
                dailyBreakdown
                byChallengeSection
                if weekData.totalCount == 0 {
                    emptyState
                }
                Spacer(minLength: 0)
            }
            .tallyPadding()
            .navigationTitle("Weekly Summary")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        onClose()
                    }
                }
            }
        }
    }
    
    // MARK: - Derived Data
    
    private var weekData: WeekData {
        let calendar = Calendar.current
        let now = Date()
        let startOfWeek = calendar.startOfWeek(for: now, offsetWeeks: weekOffset)
        let endOfWeek = calendar.date(byAdding: .day, value: 6, to: startOfWeek) ?? startOfWeek
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        
        let startStr = formatter.string(from: startOfWeek)
        let endStr = formatter.string(from: endOfWeek)
        
        let weekEntries = entries.filter { $0.date >= startStr && $0.date <= endStr }
        let totalCount = weekEntries.reduce(0) { $0 + $1.count }
        
        var byDay: [String: Int] = [:]
        var byChallenge: [String: Int] = [:]
        for entry in weekEntries {
            byDay[entry.date, default: 0] += entry.count
            byChallenge[entry.challengeId, default: 0] += entry.count
        }
        
        return WeekData(
            weekStart: startOfWeek,
            weekEnd: endOfWeek,
            totalCount: totalCount,
            daysActive: byDay.keys.count,
            byDay: byDay,
            byChallenge: byChallenge
        )
    }
    
    private var dayData: [DayData] {
        let calendar = Calendar.current
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        let todayStr = formatter.string(from: Date())
        
        return (0..<7).map { index in
            let date = calendar.date(byAdding: .day, value: index, to: weekData.weekStart) ?? weekData.weekStart
            let dateStr = formatter.string(from: date)
            return DayData(
                label: dayLabels[index],
                date: dateStr,
                count: weekData.byDay[dateStr] ?? 0,
                isToday: dateStr == todayStr
            )
        }
    }
    
    private var maxDayCount: Int {
        max(dayData.map { $0.count }.max() ?? 0, 1)
    }
    
    // MARK: - Sections
    
    private var weekHeader: some View {
        HStack {
            Button {
                weekOffset += 1
            } label: {
                Image(systemName: "chevron.left")
            }
            .buttonStyle(.plain)
            .accessibilityLabel("Previous week")
            
            Spacer()
            
            VStack(spacing: 2) {
                Text(weekRangeText)
                    .font(.tallyLabelMedium)
                    .foregroundColor(Color.tallyInk)
                if weekOffset == 0 {
                    Text("This week")
                        .font(.tallyLabelSmall)
                        .foregroundColor(Color.tallyAccent)
                }
            }
            
            Spacer()
            
            Button {
                weekOffset = max(0, weekOffset - 1)
            } label: {
                Image(systemName: "chevron.right")
            }
            .buttonStyle(.plain)
            .disabled(weekOffset == 0)
            .foregroundColor(weekOffset == 0 ? Color.tallyInkTertiary : Color.tallyInk)
            .accessibilityLabel("Next week")
        }
        .tallyPadding(.horizontal, TallySpacing.sm)
    }
    
    private var statsRow: some View {
        HStack(spacing: TallySpacing.xl) {
            VStack(spacing: TallySpacing.xs) {
                Text("\(weekData.totalCount)")
                    .font(.tallyDisplaySmall)
                    .foregroundColor(Color.tallyInk)
                Text("marks logged")
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkSecondary)
            }
            
            VStack(spacing: TallySpacing.xs) {
                Text("\(weekData.daysActive)")
                    .font(.tallyDisplaySmall)
                    .foregroundColor(Color.tallyInk)
                Text("days active")
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkSecondary)
            }
        }
        .frame(maxWidth: .infinity)
    }
    
    private var tallyPreview: some View {
        Group {
            if weekData.totalCount > 0 && weekData.totalCount <= 50 {
                TallyMarkView(count: weekData.totalCount, size: 80)
            }
        }
        .frame(maxWidth: .infinity)
    }
    
    private var dailyBreakdown: some View {
        VStack(alignment: .leading, spacing: TallySpacing.sm) {
            Text("Daily breakdown")
                .font(.tallyLabelMedium)
                .foregroundColor(Color.tallyInkSecondary)
            
            HStack(spacing: TallySpacing.xs) {
                ForEach(dayData) { day in
                    VStack(spacing: TallySpacing.xs) {
                        RoundedRectangle(cornerRadius: 8)
                            .fill(barColor(for: day))
                            .frame(height: 72)
                            .overlay(alignment: .bottom) {
                                if day.count > 0 {
                                    Text("\(day.count)")
                                        .font(.tallyLabelSmall)
                                        .foregroundColor(.white)
                                        .padding(.bottom, 4)
                                }
                            }
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(day.isToday ? Color.tallyAccent : Color.clear, lineWidth: 2)
                            )
                        Text(day.label)
                            .font(.tallyLabelSmall)
                            .foregroundColor(Color.tallyInkTertiary)
                    }
                    .frame(maxWidth: .infinity)
                }
            }
        }
        .tallyPadding()
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
    }
    
    private var byChallengeSection: some View {
        VStack(alignment: .leading, spacing: TallySpacing.sm) {
            if !weekData.byChallenge.isEmpty {
                Text("By challenge")
                    .font(.tallyLabelMedium)
                    .foregroundColor(Color.tallyInkSecondary)
            }
            
            ForEach(topChallenges, id: \.id) { item in
                HStack {
                    HStack(spacing: TallySpacing.xs) {
                        Circle()
                            .fill(Color(hex: item.color) ?? Color.tallyAccent)
                            .frame(width: 8, height: 8)
                        Text(item.name)
                            .font(.tallyLabelMedium)
                            .foregroundColor(Color.tallyInk)
                            .lineLimit(1)
                    }
                    
                    Spacer()
                    
                    Text("\(item.count)")
                        .font(.tallyLabelMedium)
                        .foregroundColor(Color.tallyInk)
                }
                .tallyPadding(.vertical, TallySpacing.xs)
                
                Divider()
                    .opacity(item.id == topChallenges.last?.id ? 0 : 1)
            }
        }
        .tallyPadding()
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
        .opacity(weekData.byChallenge.isEmpty ? 0 : 1)
    }
    
    private var emptyState: some View {
        VStack(spacing: TallySpacing.sm) {
            Text("No entries this week.")
                .font(.tallyBodyMedium)
                .foregroundColor(Color.tallyInkSecondary)
            Text(weekOffset == 0 ? "Start logging to see your progress!" : "Try a different week.")
                .font(.tallyLabelSmall)
                .foregroundColor(Color.tallyInkTertiary)
        }
        .frame(maxWidth: .infinity)
    }
    
    // MARK: - Helpers
    
    private var weekRangeText: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        let start = formatter.string(from: weekData.weekStart)
        let end = formatter.string(from: weekData.weekEnd)
        let year = Calendar.current.component(.year, from: weekData.weekStart)
        return "\(start) – \(end), \(year)"
    }
    
    private func barColor(for day: DayData) -> Color {
        if day.count == 0 {
            return Color.tallyPaper.opacity(0.6)
        }
        let ratio = Double(day.count) / Double(maxDayCount)
        let opacity = 0.2 + (0.7 * ratio)
        return Color.tallyAccent.opacity(opacity)
    }
    
    private var topChallenges: [ChallengeSummary] {
        weekData.byChallenge
            .sorted { $0.value > $1.value }
            .prefix(5)
            .compactMap { id, count in
                guard let challenge = challengesById[id] else { return nil }
                return ChallengeSummary(
                    id: id,
                    name: challenge.name,
                    color: challenge.color,
                    count: count
                )
            }
    }
}

private struct WeekData {
    let weekStart: Date
    let weekEnd: Date
    let totalCount: Int
    let daysActive: Int
    let byDay: [String: Int]
    let byChallenge: [String: Int]
}

private struct DayData: Identifiable {
    let id = UUID()
    let label: String
    let date: String
    let count: Int
    let isToday: Bool
}

private struct ChallengeSummary: Identifiable {
    let id: String
    let name: String
    let color: String
    let count: Int
}

private extension Calendar {
    func startOfWeek(for inputDate: Date, offsetWeeks: Int) -> Date {
        let weekday = component(.weekday, from: inputDate)
        let daysFromMonday = weekday == 1 ? 6 : weekday - 2
        let start = self.date(byAdding: .day, value: -daysFromMonday - (offsetWeeks * 7), to: inputDate) ?? inputDate
        return startOfDay(for: start)
    }
}

#Preview {
    WeeklySummarySheet(entries: [], challengesById: [:], onClose: {})
}
