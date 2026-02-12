import WidgetKit
import TallyWidgetShared

/// Timeline entry for challenge widgets
struct ChallengeEntry: TimelineEntry {
    let date: Date
    let challenges: [WidgetChallenge]
    let isPlaceholder: Bool
    
    init(date: Date = Date(), challenges: [WidgetChallenge] = [], isPlaceholder: Bool = false) {
        self.date = date
        self.challenges = challenges
        self.isPlaceholder = isPlaceholder
    }
    
    /// Featured challenge for small widget
    var featuredChallenge: WidgetChallenge? {
        challenges.first
    }
    
    /// Top challenges for medium widget (up to 3)
    var topChallenges: [WidgetChallenge] {
        Array(challenges.prefix(3))
    }
    
    /// Static placeholder entry for widget gallery
    static var placeholder: ChallengeEntry {
        ChallengeEntry(
            date: Date(),
            challenges: [
                WidgetChallenge(
                    id: "placeholder-1",
                    name: "Push-ups",
                    target: 1000,
                    currentCount: 425,
                    color: "#4B5563",
                    icon: "figure.strengthtraining.traditional",
                    streakCurrent: 7,
                    streakBest: 14,
                    daysRemaining: 45,
                    perDayRequired: 12.8,
                    currentPace: 14.2,
                    paceStatus: .ahead,
                    lastUpdated: Date()
                ),
                WidgetChallenge(
                    id: "placeholder-2",
                    name: "Read Pages",
                    target: 5000,
                    currentCount: 1250,
                    color: "#10B981",
                    icon: "book.fill",
                    streakCurrent: 12,
                    streakBest: 12,
                    daysRemaining: 60,
                    perDayRequired: 62.5,
                    currentPace: 58.0,
                    paceStatus: .onPace,
                    lastUpdated: Date()
                ),
                WidgetChallenge(
                    id: "placeholder-3",
                    name: "Meditation",
                    target: 365,
                    currentCount: 89,
                    color: "#8B5CF6",
                    icon: "brain.head.profile",
                    streakCurrent: 3,
                    streakBest: 21,
                    daysRemaining: 276,
                    perDayRequired: 1.0,
                    currentPace: 0.9,
                    paceStatus: .behind,
                    lastUpdated: Date()
                )
            ],
            isPlaceholder: true
        )
    }
}
