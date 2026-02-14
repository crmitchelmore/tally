import SwiftUI
import WidgetKit
import TallyWidgetShared
import TallyDesign

/// Lock Screen widget entry view
@available(iOS 17.0, *)
struct LockScreenWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: ChallengeEntry
    
    var body: some View {
        switch family {
        case .accessoryCircular:
            CircularLockScreenView(entry: entry)
        case .accessoryRectangular:
            RectangularLockScreenView(entry: entry)
        case .accessoryInline:
            InlineLockScreenView(entry: entry)
        default:
            CircularLockScreenView(entry: entry)
        }
    }
}

// MARK: - Circular Lock Screen Widget

/// Circular widget showing progress ring
@available(iOS 17.0, *)
struct CircularLockScreenView: View {
    let entry: ChallengeEntry
    
    var body: some View {
        if let challenge = entry.featuredChallenge {
            Gauge(value: challenge.progress) {
                // Compact tally representation
                Text("\(formatCount(challenge.currentCount))")
                    .font(.system(.body, design: .rounded, weight: .medium))
            }
            .gaugeStyle(.accessoryCircularCapacity)
        } else {
            Image(systemName: "checkmark.circle")
                .font(.title2)
        }
    }
    
    /// Format count to fit in small space
    private func formatCount(_ count: Int) -> String {
        if count >= 1000 {
            return String(format: "%.1fk", Double(count) / 1000)
        }
        return "\(count)"
    }
}

// MARK: - Rectangular Lock Screen Widget

/// Rectangular widget showing challenge name and progress
@available(iOS 17.0, *)
struct RectangularLockScreenView: View {
    let entry: ChallengeEntry
    
    var body: some View {
        if let challenge = entry.featuredChallenge {
            VStack(alignment: .leading, spacing: 2) {
                Text(challenge.name)
                    .font(.headline)
                    .lineLimit(1)
                
                HStack {
                    // Mini tally marks (simplified for lock screen)
                    TallyMarkView(count: min(challenge.currentCount, 25), size: 16)
                    
                    Spacer()
                    
                    Text("\(challenge.currentCount) / \(challenge.target)")
                        .font(.subheadline)
                }
                
                // Progress bar
                ProgressView(value: challenge.progress)
                    .tint(paceColor(for: challenge.paceStatus))
            }
        } else {
            HStack {
                Image(systemName: "checkmark.circle")
                Text("No challenges")
                    .font(.headline)
            }
        }
    }
    
    private func paceColor(for status: WidgetPaceStatus) -> Color {
        switch status {
        case .ahead: return .green
        case .onPace: return .primary
        case .behind: return .orange
        case .none: return .primary
        }
    }
}

// MARK: - Inline Lock Screen Widget

/// Inline widget showing brief challenge info
@available(iOS 17.0, *)
struct InlineLockScreenView: View {
    let entry: ChallengeEntry
    
    var body: some View {
        if let challenge = entry.featuredChallenge {
            // Use ViewThatFits for adaptive layout
            ViewThatFits {
                // Full version
                Text("\(challenge.name): \(challenge.currentCount)/\(challenge.target)")
                
                // Shorter version
                Text("\(challenge.currentCount)/\(challenge.target) \(challenge.name)")
                
                // Minimal version
                Text("\(challenge.currentCount)/\(challenge.target)")
            }
        } else {
            Text("No challenges")
        }
    }
}

// MARK: - Previews

#Preview("Circular", as: .accessoryCircular) {
    TallyLockScreenWidget()
} timeline: {
    ChallengeEntry.placeholder
}

#Preview("Rectangular", as: .accessoryRectangular) {
    TallyLockScreenWidget()
} timeline: {
    ChallengeEntry.placeholder
}

#Preview("Inline", as: .accessoryInline) {
    TallyLockScreenWidget()
} timeline: {
    ChallengeEntry.placeholder
}
