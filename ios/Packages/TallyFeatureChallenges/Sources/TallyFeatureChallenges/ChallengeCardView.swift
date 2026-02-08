import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Dashboard card for a challenge showing progress and stats
public struct ChallengeCardView: View {
    let challenge: Challenge
    let stats: ChallengeStats?
    let entries: [Entry]
    let onTap: () -> Void
    let onQuickAdd: () -> Void
    
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    
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
        ZStack(alignment: .topTrailing) {
            Button(action: onTap) {
                VStack(alignment: .leading, spacing: TallySpacing.md) {
                // Header: icon, name, badges
                HStack {
                    // Challenge icon with tint
                    Image(systemName: iconName)
                        .font(.tallyTitleSmall)
                        .foregroundColor(challengeColor)
                    
                    Circle()
                        .fill(challengeColor)
                        .frame(width: 6, height: 6)
                    
                    Text(challenge.name)
                        .font(.tallyTitleSmall)
                        .foregroundColor(Color.tallyInk)
                        .lineLimit(1)
                    
                    if challenge.isPublic {
                        Text("Public")
                            .font(.tallyLabelSmall)
                            .foregroundColor(Color.tallyInkSecondary)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.tallyPaperTint)
                            .cornerRadius(6)
                    }
                    
                    Spacer()
                }
                
                // Progress content with ring
                HStack(alignment: .top, spacing: TallySpacing.md) {
                    VStack(alignment: .leading, spacing: TallySpacing.xs) {
                        // Current / Target
                        HStack(alignment: .firstTextBaseline, spacing: TallySpacing.xs) {
                            Text("\(stats?.totalCount ?? 0)")
                                .font(.tallyMonoDisplay)
                                .foregroundColor(Color.tallyInk)
                            
                            Text("/ \(challenge.target)")
                                .font(.tallyMonoBody)
                                .foregroundColor(Color.tallyInkSecondary)
                            
                            Text(challenge.resolvedUnitLabel)
                                .font(.tallyLabelSmall)
                                .foregroundColor(Color.tallyInkSecondary)
                        }
                        
                        // Status badge: future challenges show "Starts in X days", active challenges show pace
                        if challenge.isFuture, let startsText = challenge.startsInText {
                            FutureChallengeBadge(text: startsText)
                        } else if let stats = stats {
                            HStack(spacing: TallySpacing.xs) {
                                PaceIndicator(status: stats.paceStatus)
                                
                                if stats.daysRemaining > 0 {
                                    Text("· \(stats.daysRemaining) days left")
                                        .font(.tallyLabelSmall)
                                        .foregroundColor(Color.tallyInkSecondary)
                                }
                            }
                        }
                    }
                    
                    Spacer()
                    
                    ProgressRingView(progress: progress, color: challengeColor, size: 56)
                        .accessibilityHidden(true)
                }
                
                // Mini activity heatmap (last 8 weeks)
                MiniHeatmapView(
                    entries: entries,
                    colorHex: challenge.color,
                    weeksToShow: 8
                )
                }
                .tallyPadding()
                .background(Color.tallyPaper)
                .cornerRadius(12)
                .shadow(color: Color.tallyInk.opacity(0.06), radius: 4, x: 0, y: 2)
                // Color accent on left edge
                .overlay(alignment: .leading) {
                    Rectangle()
                        .fill(challengeColor)
                        .frame(width: 4)
                        .cornerRadius(2)
                        .padding(.vertical, 8)
                }
            }
            .buttonStyle(.plain)
            
            quickAddButton
                .padding(.top, 12)
                .padding(.trailing, 12)
                .opacity(challenge.isFuture ? 0 : 1) // Hide quick-add for future challenges
                .allowsHitTesting(!challenge.isFuture)
        }
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("challenge-card-\(challenge.name)")
        .accessibilityLabel(accessibilityLabel)
        .accessibilityHint("Double tap to view details")
        .accessibilityAddTraits(.isButton)
        .frame(maxWidth: .infinity)
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
            Image(systemName: "plus")
                .font(.system(size: 18, weight: .semibold))
                .foregroundColor(.white)
                .frame(width: 36, height: 36)
                .background(Color.tallyAccent)
                .clipShape(Circle())
                .shadow(color: Color.tallyInk.opacity(0.12), radius: 2, x: 0, y: 1)
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Add one to \(challenge.name)")
        .accessibilityIdentifier("quick-add")
        .allowsHitTesting(true)
    }
    
    private var accessibilityLabel: String {
        var label = challenge.name
        
        // Handle future challenges
        if challenge.isFuture, let startsText = challenge.startsInText {
            label += ", \(startsText)"
            label += ", target \(challenge.target) \(challenge.resolvedUnitLabel)"
        } else if let stats = stats {
            label += ", \(stats.totalCount) of \(challenge.target)"
            label += ", \(stats.daysRemaining) days remaining"
            switch stats.paceStatus {
            case .ahead: label += ", ahead of pace"
            case .onPace: label += ", on pace"
            case .behind: label += ", behind pace"
            case .none: break
            }
        }
        if challenge.isPublic {
            label += ", public challenge"
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

private struct ProgressRingView: View {
    let progress: Double
    let color: Color
    let size: CGFloat
    
    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.tallyPaperTint, lineWidth: 4)
            
            Circle()
                .trim(from: 0, to: max(0, min(progress, 1)))
                .stroke(color, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 0.25), value: progress)
        }
        .frame(width: size, height: size)
    }
}

// MARK: - Mini Heatmap

/// Compact heatmap showing recent activity without labels
private struct MiniHeatmapView: View {
    let entries: [Entry]
    let colorHex: String?
    let weeksToShow: Int
    
    private let calendar = Calendar.current
    private let daysInWeek = 7
    
    var body: some View {
        HStack(spacing: 2) {
            ForEach(0..<weeksToShow, id: \.self) { weekIndex in
                VStack(spacing: 2) {
                    ForEach(0..<daysInWeek, id: \.self) { dayIndex in
                        let date = dateFor(weekIndex: weekIndex, dayIndex: dayIndex)
                        let count = countFor(date: date)
                        
                        RoundedRectangle(cornerRadius: 1.5)
                            .fill(heatmapColor(for: count))
                            .frame(width: 8, height: 8)
                    }
                }
            }
        }
        .frame(height: 64)
    }
    
    // MARK: - Helpers
    
    private var entriesByDate: [String: Int] {
        var dict: [String: Int] = [:]
        for entry in entries {
            dict[entry.date, default: 0] += entry.count
        }
        return dict
    }
    
    private func dateFor(weekIndex: Int, dayIndex: Int) -> Date {
        let today = Date()
        let start = calendar.date(byAdding: .weekOfYear, value: -weeksToShow, to: today) ?? today
        let weekday = calendar.component(.weekday, from: start)
        let offsetToSunday = weekday == 1 ? 0 : -(weekday - 1)
        let gridStart = calendar.date(byAdding: .day, value: offsetToSunday, to: start) ?? start
        let daysForward = weekIndex * 7 + dayIndex
        return calendar.date(byAdding: .day, value: daysForward, to: gridStart) ?? today
    }
    
    private func countFor(date: Date) -> Int {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let dateString = formatter.string(from: date)
        return entriesByDate[dateString] ?? 0
    }
    
    private func heatmapColor(for count: Int) -> Color {
        let base = Color(hex: colorHex ?? "") ?? Color.tallySuccess
        switch count {
        case 0: return Color.tallyPaperTint
        case 1...5: return base.opacity(0.3)
        case 6...15: return base.opacity(0.5)
        case 16...30: return base.opacity(0.7)
        default: return base
        }
    }
}

// MARK: - Color Extension

public extension Color {
    public init?(hex: String) {
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
