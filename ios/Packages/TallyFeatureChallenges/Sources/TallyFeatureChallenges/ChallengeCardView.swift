import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Dashboard card for a challenge showing progress and stats
public struct ChallengeCardView: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let challenge: Challenge
    let stats: ChallengeStats?
    let entries: [Entry]
    let onTap: () -> Void
    let onQuickAdd: () -> Void
    
    public init(
        challenge: Challenge,
        stats: ChallengeStats? = nil,
        entries: [Entry] = [],
        onTap: @escaping () -> Void,
        onQuickAdd: @escaping () -> Void
    ) {
        self.challenge = challenge
        self.stats = stats
        self.entries = entries
        self.onTap = onTap
        self.onQuickAdd = onQuickAdd
    }
    
    public var body: some View {
        VStack(spacing: 0) {
            Button(action: onTap) {
                VStack(alignment: .leading, spacing: TallySpacing.base) {
                    HStack(alignment: .top, spacing: TallySpacing.md) {
                        Image(systemName: iconName)
                            .font(.system(size: 20, weight: .medium))
                            .foregroundStyle(challengeColor)
                            .frame(width: 40, height: 40)
                            .background(challengeColor.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                        VStack(alignment: .leading, spacing: 4) {
                            Text(challenge.name)
                                .font(.headline)
                                .foregroundStyle(Color.tallyInk)
                                .multilineTextAlignment(.leading)
                            Text("Personal challenge")
                                .font(.caption)
                                .foregroundStyle(Color.tallyInkSecondary)
                        }
                        Spacer(minLength: 0)
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Color.tallyInkSecondary)
                            .padding(.top, 12)
                    }

                    VStack(alignment: .leading, spacing: 4) {
                        Text(stats?.totalCount ?? 0, format: .number)
                            .font(.system(size: countFontSize, weight: .medium, design: .rounded))
                            .monospacedDigit()
                            .tallyValueFeedback(value: stats?.totalCount ?? 0)
                            .foregroundStyle(Color.tallyInk)
                            .minimumScaleFactor(0.6)
                            .lineLimit(1)
                        Text("of \(challenge.target.formatted()) \(challenge.resolvedUnitLabel)")
                            .font(.subheadline)
                            .foregroundStyle(Color.tallyInkSecondary)
                    }

                    ProgressView(value: progress)
                        .tint(challengeColor)
                        .tallyAnimation(TallyMotion.easeDeliberate, value: progress)
                        .accessibilityHidden(true)

                    statusLabel
                }
                .padding(TallySpacing.lg)
                .contentShape(Rectangle())
            }
            .buttonStyle(TallyPressStyle())
            .accessibilityLabel(accessibilityLabel)
            .accessibilityHint("View challenge details")

            if !challenge.isFuture && !challenge.isArchived {
                quickAddButton
                    .padding(.horizontal, TallySpacing.lg)
                    .padding(.bottom, TallySpacing.lg)
            }
            if !dynamicTypeSize.isAccessibilitySize && !challenge.isFuture {
                activity
                    .padding(.horizontal, TallySpacing.lg)
                    .padding(.bottom, TallySpacing.lg)
            }
        }
        .frame(maxWidth: .infinity)
        .background(Color.tallySurface, in: RoundedRectangle(cornerRadius: 20))
        .overlay(RoundedRectangle(cornerRadius: 20).strokeBorder(Color.tallyInk.opacity(0.09)))
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("challenge-card-\(challenge.name)")
    }

    @ScaledMetric(relativeTo: .largeTitle) private var countFontSize: CGFloat = 48

    @ViewBuilder private var statusLabel: some View {
        if challenge.isFuture, let startsText = challenge.startsInText {
            Text(startsText)
                .font(.subheadline)
                .foregroundStyle(Color.tallyInkSecondary)
        } else if let stats {
            VStack(alignment: .leading, spacing: 4) {
                if stats.paceStatus != .none {
                    Text(paceText(stats.paceStatus))
                        .font(.subheadline.weight(.medium))
                        .foregroundStyle(Color.tallyInk)
                }
                Text("\(stats.daysRemaining) days left")
                    .font(.caption)
                    .foregroundStyle(Color.tallyInkSecondary)
            }
        }
    }

    private func paceText(_ status: PaceStatus) -> String {
        switch status {
        case .ahead: return "Ahead of pace"
        case .onPace: return "On pace"
        case .behind: return "Room to catch up"
        case .none: return ""
        }
    }

    private var activity: some View {
        HStack(spacing: TallySpacing.md) {
            Text("Activity · last 8 weeks")
                .font(.caption)
                .foregroundStyle(Color.tallyInkSecondary)
            Spacer(minLength: 0)
            MiniHeatmapView(entries: entries, colorHex: challenge.color, weeksToShow: 8)
        }
        .accessibilityHidden(true)
    }

    /// Map web icon names to SF Symbols
    private var iconName: String {
        IconMapper.sfSymbol(for: challenge.icon)
    }
    
    private var challengeColor: Color {
        Color(hex: challenge.color) ?? Color.tallyAccent
    }
    
    private var progress: Double {
        guard challenge.target > 0 else { return 0 }
        return min(1.0, Double(stats?.totalCount ?? 0) / Double(challenge.target))
    }
    
    private var quickAddButton: some View {
        Button(action: onQuickAdd) {
            Label("Log progress", systemImage: "plus")
                .font(.body.weight(.semibold))
                .frame(maxWidth: .infinity, minHeight: 48)
                .foregroundStyle(Color.tallyInk)
                .background(Color.tallyInk.opacity(0.05), in: RoundedRectangle(cornerRadius: 12))
                .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Color.tallyInk.opacity(0.08)))
                .contentShape(Rectangle())
        }
        .buttonStyle(TallyPressStyle())
        .accessibilityLabel("Log progress for \(challenge.name)")
        .accessibilityIdentifier("quick-add")
    }

    private var accessibilityLabel: String {
        var label = challenge.name
        
        // Handle future challenges
        if challenge.isFuture, let startsText = challenge.startsInText {
            label += ", \(startsText)"
            label += ", target \(challenge.target) \(challenge.resolvedUnitLabel)"
        } else if let stats = stats {
            label += ", \(stats.totalCount) of \(challenge.target) \(challenge.resolvedUnitLabel)"
            label += ", \(stats.daysRemaining) days remaining"
            switch stats.paceStatus {
            case .ahead: label += ", ahead of pace"
            case .onPace: label += ", on pace"
            case .behind: label += ", behind pace"
            case .none: break
            }
        } else {
            label += ", 0 of \(challenge.target) \(challenge.resolvedUnitLabel)"
        }
        return label
    }
}

/// Maps web icon identifiers to SF Symbols
public enum IconMapper {
    private static let mapping: [String: String] = [
        // Direct SF Symbol names
        "checkmark": "checkmark",
        "book.fill": "book.fill",
        "figure.run": "figure.run",
        "pencil.and.outline": "pencil.and.outline",
        "music.note": "music.note",
        "paintbrush.fill": "paintbrush.fill",
        "cup.and.saucer.fill": "cup.and.saucer.fill",
        "dumbbell.fill": "dumbbell.fill",
        "heart.fill": "heart.fill",
        "star.fill": "star.fill",
        "leaf.fill": "leaf.fill",
        "brain.head.profile": "brain.head.profile",
        
        // Web icon names (emoji-style) to SF Symbols
        "fitness": "dumbbell.fill",
        "book": "book.fill",
        "run": "figure.run",
        "running": "figure.run",
        "pencil": "pencil.and.outline",
        "write": "pencil.and.outline",
        "writing": "pencil.and.outline",
        "music": "music.note",
        "art": "paintbrush.fill",
        "paint": "paintbrush.fill",
        "coffee": "cup.and.saucer.fill",
        "drink": "cup.and.saucer.fill",
        "workout": "dumbbell.fill",
        "gym": "dumbbell.fill",
        "exercise": "dumbbell.fill",
        "health": "heart.fill",
        "love": "heart.fill",
        "star": "star.fill",
        "favorite": "star.fill",
        "nature": "leaf.fill",
        "plant": "leaf.fill",
        "mind": "brain.head.profile",
        "meditation": "brain.head.profile",
        "meditate": "brain.head.profile",
        "code": "chevron.left.forwardslash.chevron.right",
        "programming": "chevron.left.forwardslash.chevron.right",
        "study": "book.fill",
        "learn": "graduationcap.fill",
        "swim": "figure.pool.swim",
        "swimming": "figure.pool.swim",
        "bike": "bicycle",
        "cycling": "bicycle",
        "walk": "figure.walk",
        "walking": "figure.walk",
        "sleep": "moon.fill",
        "rest": "moon.fill",
        "water": "drop.fill",
        "hydration": "drop.fill",
        "food": "fork.knife",
        "meal": "fork.knife",
        "money": "dollarsign.circle.fill",
        "save": "banknote.fill",
        "target": "target",
        "goal": "target",
        "default": "checkmark",
    ]
    
    public static func sfSymbol(for icon: String) -> String {
        // First check if it's already a valid SF Symbol name
        if UIImage(systemName: icon) != nil {
            return icon
        }
        // Then check our mapping
        let lowercased = icon.lowercased()
        return mapping[lowercased] ?? mapping[icon] ?? "checkmark"
    }
}

/// Badge for future challenges that haven't started yet
struct FutureChallengeBadge: View {
    let text: String
    
    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: "calendar.badge.clock")
                .font(.system(size: 10, weight: .semibold))
            Text(text)
                .font(.tallyLabelSmall)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(Color.tallyInkSecondary.opacity(0.15))
        .foregroundColor(Color.tallyInkSecondary)
        .cornerRadius(6)
    }
}

/// Small pace indicator badge
struct PaceIndicator: View {
    let status: PaceStatus
    
    var body: some View {
        HStack(spacing: 2) {
            Image(systemName: iconName)
                .font(.system(size: 10, weight: .semibold))
            Text(text)
                .font(.tallyLabelSmall)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(backgroundColor.opacity(0.15))
        .foregroundColor(foregroundColor)
        .cornerRadius(6)
    }
    
    private var iconName: String {
        switch status {
        case .ahead: return "arrow.up.right"
        case .onPace: return "equal"
        case .behind: return "arrow.down.right"
        case .none: return "minus"
        }
    }
    
    private var text: String {
        switch status {
        case .ahead: return "Ahead"
        case .onPace: return "On pace"
        case .behind: return "Behind"
        case .none: return ""
        }
    }
    
    private var backgroundColor: Color {
        switch status {
        case .ahead: return Color.tallySuccess
        case .onPace: return Color.tallyInk
        case .behind: return Color.tallyWarning
        case .none: return Color.tallyInkTertiary
        }
    }
    
    private var foregroundColor: Color {
        switch status {
        case .ahead: return Color.tallySuccess
        case .onPace: return Color.tallyInk
        case .behind: return Color.tallyWarning
        case .none: return Color.tallyInkTertiary
        }
    }
}

/// Compact recent activity, including the current week. Future days stay blank.
private struct MiniHeatmapView: View {
    let entries: [Entry]
    let colorHex: String?
    let weeksToShow: Int

    var body: some View {
        let days = RecentActivity.days(entries: entries, weeks: weeksToShow)
        HStack(spacing: 3) {
            ForEach(0..<weeksToShow, id: \.self) { week in
                VStack(spacing: 3) {
                    ForEach(0..<7, id: \.self) { day in
                        let activity = days[week * 7 + day]
                        RoundedRectangle(cornerRadius: 2)
                            .fill(color(for: activity.count))
                            .frame(width: 7, height: 7)
                            .opacity(activity.isFuture ? 0 : 1)
                    }
                }
            }
        }
    }

    private func color(for count: Int) -> Color {
        let base = Color(hex: colorHex ?? "") ?? Color.tallyAccent
        switch count {
        case ...0: return Color.tallyInk.opacity(0.08)
        case 1...5: return base.opacity(0.35)
        case 6...15: return base.opacity(0.55)
        case 16...30: return base.opacity(0.75)
        default: return base
        }
    }
}

// MARK: - Color Extension

public extension Color {
    init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")
        
        guard hexSanitized.count == 6 else { return nil }
        
        var rgb: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&rgb)
        
        self.init(
            red: Double((rgb & 0xFF0000) >> 16) / 255.0,
            green: Double((rgb & 0x00FF00) >> 8) / 255.0,
            blue: Double(rgb & 0x0000FF) / 255.0
        )
    }
}

#Preview {
    ChallengeCardView(
        challenge: Challenge(
            id: "1",
            userId: "user1",
            name: "Read 100 Books",
            target: 100,
            timeframeType: .year,
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            color: "#D94343",
            icon: "book.fill",
            isPublic: true,
            isArchived: false,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z"
        ),
        stats: ChallengeStats(
            challengeId: "1",
            totalCount: 25,
            remaining: 75,
            daysElapsed: 30,
            daysRemaining: 335,
            perDayRequired: 0.22,
            currentPace: 0.83,
            paceStatus: .ahead,
            streakCurrent: 5,
            streakBest: 10,
            bestDay: nil,
            dailyAverage: 0.83
        ),
        onTap: {},
        onQuickAdd: {}
    )
    .padding()
    .background(Color.tallyPaperTint)
}
