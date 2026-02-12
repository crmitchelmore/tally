import SwiftUI
import WidgetKit
import TallyWidgetShared
import TallyDesign

// MARK: - Previews

#Preview("Small Widget", as: .systemSmall) {
    TallyChallengeWidget()
} timeline: {
    ChallengeEntry.placeholder
}

#Preview("Medium Widget", as: .systemMedium) {
    TallyChallengeWidget()
} timeline: {
    ChallengeEntry.placeholder
}

#Preview("Large Widget", as: .systemLarge) {
    TallyChallengeWidget()
} timeline: {
    ChallengeEntry.placeholder
}

#Preview("Empty Widget", as: .systemSmall) {
    TallyChallengeWidget()
} timeline: {
    ChallengeEntry(date: Date(), challenges: [])
}
