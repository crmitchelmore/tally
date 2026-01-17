import SwiftUI
import TallyFeatureAPIClient

struct ChallengeCardView: View {
    let challenge: Challenge
    let stats: ChallengeStats
    let totalCount: Int

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(challenge.name)
                        .font(.headline)
                        .foregroundStyle(.primary)
                    Text(timeframeLabel)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Text("\(totalCount)/\(challenge.targetNumber)")
                    .font(.callout.weight(.semibold))
            }

            ProgressRing(progress: progress)
                .frame(height: 12)

            HStack {
                Text(paceLabel)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                Text("\(stats.currentStreak) day streak")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Color(.systemBackground))
                .shadow(color: .black.opacity(0.08), radius: 16, y: 8)
        )
    }

    private var progress: Double {
        guard challenge.targetNumber > 0 else { return 0 }
        return min(1, Double(totalCount) / Double(challenge.targetNumber))
    }

    private var paceLabel: String {
        if stats.requiredPerDay == 0 {
            return "Target met"
        }
        return String(format: "%.1f/day needed", stats.requiredPerDay)
    }

    private var timeframeLabel: String {
        switch challenge.timeframeUnit {
        case "year":
            return "Year \(challenge.year)"
        case "month":
            return "Monthly"
        default:
            return "Custom timeframe"
        }
    }

}

struct ProgressRing: View {
    let progress: Double

    var body: some View {
        GeometryReader { proxy in
            let width = proxy.size.width
            ZStack(alignment: .leading) {
                Capsule()
                    .fill(Color(.systemGray6))
                Capsule()
                    .fill(Color(red: 0.7, green: 0.12, blue: 0.14))
                    .frame(width: width * CGFloat(progress))
            }
        }
    }
}
