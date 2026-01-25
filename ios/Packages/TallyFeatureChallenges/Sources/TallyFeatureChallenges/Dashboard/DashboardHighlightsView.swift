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
                    title: "Today",
                    value: "\(stats.today)",
                    icon: "calendar",
                    color: Color.tallyAccent
                )
                
                HighlightCard(
                    title: "Total",
                    value: "\(stats.totalMarks)",
                    icon: "chart.bar.fill",
                    color: Color.tallySuccess
                )
                
                HighlightCard(
                    title: "Best Streak",
                    value: "\(stats.bestStreak)d",
                    icon: "flame.fill",
                    color: Color.orange
                )
                
                HighlightCard(
                    title: "Pace",
                    value: paceStatusText,
                    icon: paceIcon,
                    color: paceColor
                )
            }
            
            // Best set stats if available
            if let bestSet = stats.bestSet {
                HStack(spacing: TallySpacing.md) {
                    HighlightCard(
                        title: "Best Set",
                        value: "\(bestSet.value)",
                        icon: "dumbbell.fill",
                        color: Color.purple
                    )
                    
                    if let avgSet = stats.avgSetValue {
                        HighlightCard(
                            title: "Avg Set",
                            value: String(format: "%.1f", avgSet),
                            icon: "equal.circle.fill",
                            color: Color.teal
                        )
                    }
                }
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
    
    private var paceIcon: String {
        switch stats.overallPaceStatus {
        case .ahead: return "arrow.up.right"
        case .onPace: return "equal"
        case .behind: return "arrow.down.right"
        case .none: return "minus"
        }
    }
    
    private var paceColor: Color {
        switch stats.overallPaceStatus {
        case .ahead: return Color.tallySuccess
        case .onPace: return Color.tallyInk
        case .behind: return Color.tallyWarning
        case .none: return Color.tallyInkTertiary
        }
    }
}

struct HighlightCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: TallySpacing.xs) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(color)
                Text(title)
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkSecondary)
                Spacer()
            }
            
            Text(value)
                .font(.tallyMonoDisplay)
                .foregroundColor(Color.tallyInk)
        }
        .padding(TallySpacing.md)
        .background(Color.tallyPaperTint)
        .cornerRadius(12)
    }
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
