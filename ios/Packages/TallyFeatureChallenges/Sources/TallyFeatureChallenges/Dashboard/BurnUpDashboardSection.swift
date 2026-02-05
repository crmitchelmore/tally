import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Dashboard section showing burn-up charts for top challenges.
public struct BurnUpDashboardSection: View {
    let challenges: [Challenge]
    let stats: [String: ChallengeStats]
    let entries: [Entry]
    
    public init(challenges: [Challenge], stats: [String: ChallengeStats], entries: [Entry]) {
        self.challenges = challenges
        self.stats = stats
        self.entries = entries
    }
    
    public var body: some View {
        if !topChallenges.isEmpty {
            VStack(alignment: .leading, spacing: TallySpacing.md) {
                Text("Goal Progress")
                    .font(.tallyTitleSmall)
                    .foregroundColor(Color.tallyInk)
                    .tallyPadding(.horizontal)
                
                ForEach(topChallenges) { challenge in
                    // Show chart if stats exist; newly-created challenges may not have stats yet
                    if let stat = stats[challenge.id] {
                        BurnUpChartView(
                            challenge: challenge,
                            stats: stat,
                            entries: entries.filter { $0.challengeId == challenge.id }
                        )
                        .tallyPadding(.horizontal)
                    }
                }
            }
        }
    }
    
    private var topChallenges: [Challenge] {
        Array(challenges.filter { !$0.isArchived }.prefix(3))
    }
}

#Preview {
    BurnUpDashboardSection(challenges: [], stats: [:], entries: [])
}
