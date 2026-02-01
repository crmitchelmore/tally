import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Dashboard section showing followed challenges.
public struct FollowedChallengesSection: View {
    let challenges: [PublicChallenge]
    let onUnfollow: (String) async -> Void
    
    public init(challenges: [PublicChallenge], onUnfollow: @escaping (String) async -> Void) {
        self.challenges = challenges
        self.onUnfollow = onUnfollow
    }
    
    public var body: some View {
        if !challenges.isEmpty {
            VStack(alignment: .leading, spacing: TallySpacing.md) {
                HStack {
                    Text("Following")
                        .font(.tallyTitleSmall)
                        .foregroundColor(Color.tallyInk)
                    Text("(\(challenges.count))")
                        .font(.tallyLabelSmall)
                        .foregroundColor(Color.tallyInkSecondary)
                }
                .tallyPadding(.horizontal)
                
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: TallySpacing.md) {
                        ForEach(challenges) { challenge in
                            FollowedChallengeCard(challenge: challenge, onUnfollow: onUnfollow)
                        }
                    }
                    .tallyPadding(.horizontal)
                }
            }
        }
    }
}

private struct FollowedChallengeCard: View {
    let challenge: PublicChallenge
    let onUnfollow: (String) async -> Void
    @State private var isUnfollowing = false
    
    var body: some View {
        VStack(alignment: .leading, spacing: TallySpacing.sm) {
            HStack {
                Circle()
                    .fill(Color(hex: challenge.color) ?? Color.tallyAccent)
                    .frame(width: 10, height: 10)
                Text(challenge.name)
                    .font(.tallyLabelMedium)
                    .foregroundColor(Color.tallyInk)
                    .lineLimit(1)
            }
            
            if !challenge.owner.name.isEmpty {
                Text("by \(challenge.owner.name)")
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkSecondary)
            }
            
            HStack(alignment: .firstTextBaseline, spacing: TallySpacing.xs) {
                Text("\(challenge.totalReps)")
                    .font(.tallyMonoBody)
                    .foregroundColor(Color.tallyInk)
                Text("/ \(challenge.target)")
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkSecondary)
            }
            
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Rectangle()
                        .fill(Color.tallyPaperTint)
                        .frame(height: 4)
                        .cornerRadius(2)
                    Rectangle()
                        .fill(Color(hex: challenge.color) ?? Color.tallyAccent)
                        .frame(width: progressWidth(totalWidth: geo.size.width), height: 4)
                        .cornerRadius(2)
                }
            }
            .frame(height: 4)
            
            HStack {
                Text("\(challenge.followerCount) followers")
                    .font(.tallyLabelSmall)
                    .foregroundColor(Color.tallyInkSecondary)
                Spacer()
                Button {
                    Task {
                        isUnfollowing = true
                        await onUnfollow(challenge.id)
                        isUnfollowing = false
                    }
                } label: {
                    Text(isUnfollowing ? "..." : "Unfollow")
                        .font(.tallyLabelSmall)
                        .foregroundColor(Color.tallyInkSecondary)
                        .padding(.horizontal, TallySpacing.sm)
                        .padding(.vertical, TallySpacing.xs)
                        .background(Color.tallyPaperTint)
                        .cornerRadius(8)
                }
                .buttonStyle(.plain)
                .disabled(isUnfollowing)
            }
        }
        .tallyPadding()
        .frame(width: 240)
        .background(Color.tallyPaper)
        .cornerRadius(12)
        .shadow(color: Color.tallyInk.opacity(0.06), radius: 4, x: 0, y: 2)
    }
    
    private var progress: Double {
        guard challenge.target > 0 else { return 0 }
        return min(1.0, Double(challenge.totalReps) / Double(challenge.target))
    }
    
    private func progressWidth(totalWidth: CGFloat) -> CGFloat {
        max(0, min(totalWidth, totalWidth * progress))
    }
}

#Preview {
    FollowedChallengesSection(challenges: [], onUnfollow: { _ in })
}
