import SwiftUI
import WidgetKit
import TallyWidgetShared
import TallyDesign

/// Main entry view that switches based on widget family
struct ChallengeWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: ChallengeEntry
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallChallengeView(entry: entry)
        case .systemMedium:
            MediumChallengeView(entry: entry)
        case .systemLarge:
            LargeChallengeView(entry: entry)
        default:
            SmallChallengeView(entry: entry)
        }
    }
}

// MARK: - Small Widget

/// Small widget showing single featured challenge
struct SmallChallengeView: View {
    let entry: ChallengeEntry
    
    var body: some View {
        if let challenge = entry.featuredChallenge {
            VStack(alignment: .leading, spacing: TallySpacing.xs) {
                // Challenge name
                Text(challenge.name)
                    .font(.tallyLabelMedium)
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                
                Spacer()
                
                // Tally marks visualization
                HStack {
                    TallyMarkView(count: challenge.currentCount, size: 36)
                    Spacer()
                }
                
                Spacer()
                
                // Count and pace
                HStack(alignment: .lastTextBaseline) {
                    Text("\(challenge.currentCount)")
                        .font(.tallyDisplaySmall)
                        .foregroundStyle(.primary)
                    
                    Text("/ \(challenge.target)")
                        .font(.tallyLabelSmall)
                        .foregroundStyle(.secondary)
                    
                    Spacer()
                    
                    PaceIndicator(status: challenge.paceStatus, compact: true)
                }
            }
            .padding(TallySpacing.sm)
        } else {
            EmptyWidgetView()
        }
    }
}

// MARK: - Medium Widget

/// Medium widget showing 2-3 challenges in a row
struct MediumChallengeView: View {
    let entry: ChallengeEntry
    
    var body: some View {
        if entry.challenges.isEmpty {
            EmptyWidgetView()
        } else {
            HStack(spacing: TallySpacing.md) {
                ForEach(entry.topChallenges) { challenge in
                    ChallengeColumn(challenge: challenge)
                    
                    if challenge.id != entry.topChallenges.last?.id {
                        Divider()
                    }
                }
            }
            .padding(TallySpacing.sm)
        }
    }
}

/// Single challenge column for medium widget
struct ChallengeColumn: View {
    let challenge: WidgetChallenge
    
    var body: some View {
        VStack(alignment: .leading, spacing: TallySpacing.xxs) {
            // Name
            Text(challenge.name)
                .font(.tallyLabelSmall)
                .foregroundStyle(.primary)
                .lineLimit(1)
            
            // Tally marks
            TallyMarkView(count: challenge.currentCount, size: 28)
                .frame(maxWidth: .infinity, alignment: .leading)
            
            Spacer()
            
            // Count
            HStack(alignment: .lastTextBaseline, spacing: 2) {
                Text("\(challenge.currentCount)")
                    .font(.tallyBodyLarge)
                    .foregroundStyle(.primary)
                
                Text("/ \(challenge.target)")
                    .font(.tallyCaptionMedium)
                    .foregroundStyle(.secondary)
            }
            
            // Pace
            PaceIndicator(status: challenge.paceStatus, compact: true)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Large Widget

/// Large widget showing detailed challenge info with streaks
struct LargeChallengeView: View {
    let entry: ChallengeEntry
    
    var body: some View {
        if entry.challenges.isEmpty {
            EmptyWidgetView()
        } else {
            VStack(alignment: .leading, spacing: TallySpacing.sm) {
                // Header
                Text("Active Challenges")
                    .font(.tallyLabelMedium)
                    .foregroundStyle(.secondary)
                
                // Challenge rows
                ForEach(entry.challenges.prefix(4)) { challenge in
                    ChallengeRow(challenge: challenge)
                    
                    if challenge.id != entry.challenges.prefix(4).last?.id {
                        Divider()
                    }
                }
                
                if entry.challenges.count > 4 {
                    Text("+\(entry.challenges.count - 4) more")
                        .font(.tallyCaptionMedium)
                        .foregroundStyle(.tertiary)
                }
            }
            .padding(TallySpacing.sm)
        }
    }
}

/// Challenge row for large widget with streak info
struct ChallengeRow: View {
    let challenge: WidgetChallenge
    
    var body: some View {
        HStack(spacing: TallySpacing.md) {
            // Tally marks
            TallyMarkView(count: challenge.currentCount, size: 32)
                .frame(width: 60)
            
            // Info
            VStack(alignment: .leading, spacing: 2) {
                Text(challenge.name)
                    .font(.tallyLabelSmall)
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                
                HStack(spacing: TallySpacing.xs) {
                    Text("\(challenge.currentCount) / \(challenge.target)")
                        .font(.tallyCaptionMedium)
                        .foregroundStyle(.secondary)
                    
                    if challenge.streakCurrent > 0 {
                        Text("•")
                            .foregroundStyle(.tertiary)
                        
                        Text("\(challenge.streakCurrent) day streak")
                            .font(.tallyCaptionMedium)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            
            Spacer()
            
            // Pace
            PaceIndicator(status: challenge.paceStatus, compact: false)
        }
    }
}

// MARK: - Supporting Views

/// Empty state when no challenges exist
struct EmptyWidgetView: View {
    var body: some View {
        VStack(spacing: TallySpacing.xs) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 24))
                .foregroundStyle(.tertiary)
            
            Text("No active challenges")
                .font(.tallyCaptionMedium)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

/// Pace status indicator
struct PaceIndicator: View {
    let status: WidgetPaceStatus
    let compact: Bool
    
    var body: some View {
        if status != .none {
            HStack(spacing: 2) {
                Circle()
                    .fill(statusColor)
                    .frame(width: compact ? 6 : 8, height: compact ? 6 : 8)
                
                if !compact {
                    Text(status.displayText)
                        .font(.tallyCaptionSmall)
                        .foregroundStyle(statusColor)
                }
            }
        }
    }
    
    private var statusColor: Color {
        switch status {
        case .ahead:
            return .tallySuccess
        case .onPace:
            return .tallyInkSecondary
        case .behind:
            return .tallyWarning
        case .none:
            return .clear
        }
    }
}
