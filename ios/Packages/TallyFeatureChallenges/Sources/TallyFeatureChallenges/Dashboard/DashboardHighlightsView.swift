import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Dashboard highlights showing key stats
public struct DashboardHighlightsView: View {
    let stats: DashboardStats
    
    public init(stats: DashboardStats) {
        self.stats = stats
    }
    
    public var body: some View {
        VStack(spacing: TallySpacing.md) {
            HStack {
                Text("Highlights")
                    .font(.tallyTitleSmall)
                    .foregroundColor(Color.tallyInk)
                Spacer()
            }
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: TallySpacing.md) {
                HighlightCard(
                    title: "Total marks",
                    value: formatNumber(stats.totalMarks),
                    tallyCount: stats.totalMarks <= 25 ? stats.totalMarks : nil
                )
                
                HighlightCard(
                    title: "Today",
                    value: "\(stats.today)",
                    tallyCount: stats.today > 0 && stats.today <= 10 ? stats.today : nil
                )
                
                HighlightCard(
                    title: "Best streak",
                    value: "\(stats.bestStreak) days"
                )
                
                HighlightCard(
                    title: "Overall pace",
                    value: paceStatusText
                )
            }
            
        }
        .tallyPadding(.horizontal)
    }
    
    private var paceStatusText: String {
        switch stats.overallPaceStatus {
        case .ahead: return "Ahead"
        case .onPace: return "On Pace"
        case .behind: return "Behind"
        case .none: return "—"
        }
    }
    
    
    private func formatNumber(_ value: Int) -> String {
        Self.numberFormatter.string(from: NSNumber(value: value)) ?? "\(value)"
    }
}

struct HighlightCard: View {
    let title: String
    let value: String
    let tallyCount: Int?
    
    init(title: String, value: String, tallyCount: Int? = nil) {
        self.title = title
        self.value = value
        self.tallyCount = tallyCount
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: TallySpacing.xs) {
            Text(title)
                .font(.tallyLabelSmall)
                .foregroundColor(Color.tallyInkSecondary)
            
            HStack(alignment: .firstTextBaseline, spacing: TallySpacing.xs) {
                Text(value)
                    .font(.tallyMonoDisplay)
                    .foregroundColor(Color.tallyInk)
                
                if let tallyCount {
                    TallyMarkView(count: min(tallyCount, 5), size: 18)
                        .opacity(0.7)
                }
            }
        }
        .padding(TallySpacing.md)
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
    }
}

private extension DashboardHighlightsView {
    static let numberFormatter: NumberFormatter = {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter
    }()
}

#Preview {
    DashboardHighlightsView(
        stats: DashboardStats(
            totalMarks: 2500,
            today: 25,
            bestStreak: 7,
            overallPaceStatus: .ahead,
            bestSet: DashboardStats.BestSet(value: 30, date: "2026-01-15", challengeId: "1"),
            avgSetValue: 15.5
        )
    )
}
