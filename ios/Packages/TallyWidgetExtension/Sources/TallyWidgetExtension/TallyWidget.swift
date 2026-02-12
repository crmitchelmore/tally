import WidgetKit
import SwiftUI
import TallyWidgetShared
import TallyDesign

/// Main widget bundle containing all Tally widgets
@main
struct TallyWidgetBundle: WidgetBundle {
    var body: some Widget {
        TallyChallengeWidget()
        if #available(iOS 17.0, *) {
            TallyLockScreenWidget()
        }
    }
}

// MARK: - Home Screen Widget

/// Home Screen widget showing challenge progress with tally marks
struct TallyChallengeWidget: Widget {
    let kind: String = "TallyChallengeWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ChallengeTimelineProvider()) { entry in
            ChallengeWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Challenge Progress")
        .description("Track your challenge progress with beautiful tally marks.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Lock Screen Widget

@available(iOS 17.0, *)
struct TallyLockScreenWidget: Widget {
    let kind: String = "TallyLockScreenWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: ChallengeTimelineProvider()) { entry in
            LockScreenWidgetEntryView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Challenge Count")
        .description("See your challenge count at a glance.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}
