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
                // Header: icon, name, pace indicator
                HStack {
                    // Challenge icon
                    Image(systemName: challenge.icon)
                        .font(.tallyTitleSmall)
                        .foregroundColor(challengeColor)
                    
                    Text(challenge.name)
                        .font(.tallyTitleSmall)
                        .foregroundColor(Color.tallyInk)
                        .lineLimit(1)
                    
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
                        
                        // Progress bar
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
        }
        .buttonStyle(.plain)
        .accessibilityElement(children: .combine)
        .accessibilityLabel(accessibilityLabel)
        .accessibilityHint("Double tap to view details")
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
        return label
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

extension Color {
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
        stats: nil,
        onTap: {},
        onQuickAdd: {}
    )
    .padding()
    .background(Color.tallyPaperTint)
}
