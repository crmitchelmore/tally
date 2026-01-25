import SwiftUI
import TallyDesign
import TallyFeatureAPIClient

/// Dashboard card for a challenge showing progress and stats
public struct ChallengeCardView: View {
    let challenge: Challenge
    let stats: ChallengeStats?
    let onTap: () -> Void
    let onQuickAdd: () -> Void
    
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    
    public init(
        challenge: Challenge,
        stats: ChallengeStats? = nil,
        onTap: @escaping () -> Void,
        onQuickAdd: @escaping () -> Void
    ) {
        self.challenge = challenge
        self.stats = stats
        self.onTap = onTap
        self.onQuickAdd = onQuickAdd
    }
    
    public var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: TallySpacing.md) {
                // Header: icon, name, badges, pace indicator
                HStack {
                    // Challenge icon with tint
                    Image(systemName: iconName)
                        .font(.tallyTitleSmall)
                        .foregroundColor(challengeColor)
                    
                    Text(challenge.name)
                        .font(.tallyTitleSmall)
                        .foregroundColor(Color.tallyInk)
                        .lineLimit(1)
                    
                    // Public badge
                    if challenge.isPublic {
                        Image(systemName: "globe")
                            .font(.caption)
                            .foregroundColor(Color.tallyInkSecondary)
                    }
                    
                    Spacer()
                    
                    // Pace indicator
                    if let stats = stats {
                        PaceIndicator(status: stats.paceStatus)
                    }
                }
                
                // Progress visualization
                HStack(alignment: .bottom, spacing: TallySpacing.md) {
                    // Tally marks for current count
                    TallyMarkView(count: stats?.totalCount ?? 0, size: 48)
                    
                    VStack(alignment: .leading, spacing: TallySpacing.xs) {
                        // Current / Target
                        HStack(alignment: .firstTextBaseline, spacing: TallySpacing.xs) {
                            Text("\(stats?.totalCount ?? 0)")
                                .font(.tallyMonoDisplay)
                                .foregroundColor(Color.tallyInk)
                            
                            Text("/ \(challenge.target)")
                                .font(.tallyMonoBody)
                                .foregroundColor(Color.tallyInkSecondary)
                        }
                        
                        // Progress bar with challenge color
                        GeometryReader { geometry in
                            ZStack(alignment: .leading) {
                                Rectangle()
                                    .fill(Color.tallyPaperTint)
                                    .frame(height: 4)
                                    .cornerRadius(2)
                                
                                Rectangle()
                                    .fill(challengeColor)
                                    .frame(width: progressWidth(for: geometry.size.width), height: 4)
                                    .cornerRadius(2)
                            }
                        }
                        .frame(height: 4)
                    }
                    
                    Spacer()
                    
                    // Quick add button
                    Button(action: onQuickAdd) {
                        Image(systemName: "plus.circle.fill")
                            .font(.system(size: 44))
                            .foregroundColor(Color.tallyAccent)
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("Add one to \(challenge.name)")
                }
                
                // Footer: days remaining, per-day required
                if let stats = stats {
                    HStack {
                        Label("\(stats.daysRemaining) days left", systemImage: "calendar")
                            .font(.tallyLabelSmall)
                            .foregroundColor(Color.tallyInkSecondary)
                        
                        Spacer()
                        
                        Text("\(String(format: "%.1f", stats.perDayRequired))/day needed")
                            .font(.tallyLabelSmall)
                            .foregroundColor(Color.tallyInkSecondary)
                    }
                }
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
        .accessibilityElement(children: .combine)
        .accessibilityIdentifier("challenge-card-\(challenge.name)")
        .accessibilityLabel(accessibilityLabel)
        .accessibilityHint("Double tap to view details")
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
    
    private func progressWidth(for totalWidth: CGFloat) -> CGFloat {
        max(0, min(totalWidth, totalWidth * progress))
    }
    
    private var accessibilityLabel: String {
        var label = challenge.name
        if let stats = stats {
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
