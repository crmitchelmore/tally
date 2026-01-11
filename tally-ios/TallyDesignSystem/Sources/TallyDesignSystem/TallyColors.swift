import SwiftUI

/// Tally Design System - Colors
/// 
/// Semantic colors matching the cross-platform design tokens.
/// All colors support light and dark mode automatically.
public enum TallyColors {
    
    // MARK: - Brand Colors
    
    /// Primary brand color - the tally line mark
    public static let ink = Color(light: .init(red: 0.15, green: 0.14, blue: 0.13),
                                  dark: .init(red: 0.85, green: 0.84, blue: 0.83))
    
    /// Warm accent - the 5th tally slash
    public static let slash = Color(light: .init(red: 0.76, green: 0.35, blue: 0.25),
                                   dark: .init(red: 0.85, green: 0.45, blue: 0.35))
    
    /// Focus ring color for accessibility
    public static let focus = Color(light: .init(red: 0.3, green: 0.5, blue: 0.8),
                                   dark: .init(red: 0.4, green: 0.6, blue: 0.9))
    
    // MARK: - Status Colors
    
    /// Ahead of pace - green tint
    public static let statusAhead = Color(light: .init(red: 0.2, green: 0.6, blue: 0.35),
                                         dark: .init(red: 0.3, green: 0.7, blue: 0.45))
    
    /// On pace - amber/yellow tint
    public static let statusOnPace = Color(light: .init(red: 0.65, green: 0.55, blue: 0.2),
                                          dark: .init(red: 0.75, green: 0.65, blue: 0.3))
    
    /// Behind pace - matches brand slash (warm)
    public static let statusBehind = Color(light: .init(red: 0.76, green: 0.35, blue: 0.25),
                                          dark: .init(red: 0.85, green: 0.45, blue: 0.35))
    
    /// Streak/fire indicator - orange
    public static let statusStreak = Color(light: .init(red: 0.85, green: 0.5, blue: 0.2),
                                          dark: .init(red: 0.9, green: 0.55, blue: 0.25))
    
    // MARK: - Heatmap Colors
    
    public static let heatmap0 = Color(light: .init(white: 0.94),
                                      dark: .init(white: 0.25))
    
    public static let heatmap1 = Color(light: .init(red: 0.75, green: 0.6, blue: 0.5),
                                      dark: .init(red: 0.4, green: 0.32, blue: 0.27))
    
    public static let heatmap2 = Color(light: .init(red: 0.6, green: 0.45, blue: 0.35),
                                      dark: .init(red: 0.5, green: 0.38, blue: 0.3))
    
    public static let heatmap3 = Color(light: .init(red: 0.45, green: 0.32, blue: 0.24),
                                      dark: .init(red: 0.6, green: 0.45, blue: 0.35))
    
    public static let heatmap4 = Color(light: .init(red: 0.3, green: 0.2, blue: 0.15),
                                      dark: .init(red: 0.7, green: 0.52, blue: 0.4))
    
    // MARK: - Record Colors
    
    public static let recordBestDay = Color(red: 0.8, green: 0.6, blue: 0.25)
    public static let recordStreak = Color(red: 0.76, green: 0.35, blue: 0.25)
    public static let recordAverage = Color(red: 0.2, green: 0.6, blue: 0.35)
    public static let recordActive = Color(red: 0.4, green: 0.35, blue: 0.75)
    public static let recordEntry = Color(red: 0.55, green: 0.35, blue: 0.75)
    public static let recordMilestone = Color(red: 0.8, green: 0.5, blue: 0.25)
    public static let recordMaxReps = Color(red: 0.8, green: 0.4, blue: 0.25)
    
    // MARK: - Surface Colors
    
    public static let cardBackground = Color(light: .white,
                                            dark: .init(white: 0.15))
    
    public static let cardBorder = Color(light: .init(white: 0.9),
                                        dark: .init(white: 0.25))
    
    // MARK: - Helpers
    
    /// Get the appropriate status color for a pace status
    public static func statusColor(for status: PaceStatus) -> Color {
        switch status {
        case .ahead: return statusAhead
        case .onPace: return statusOnPace
        case .behind: return statusBehind
        }
    }
    
    /// Get heatmap color for a level (0-4)
    public static func heatmapColor(level: Int) -> Color {
        switch level {
        case 0: return heatmap0
        case 1: return heatmap1
        case 2: return heatmap2
        case 3: return heatmap3
        default: return heatmap4
        }
    }
}

public enum PaceStatus {
    case ahead
    case onPace
    case behind
}

// MARK: - Color Extension for Light/Dark

extension Color {
    init(light: Color, dark: Color) {
        self.init(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
        })
    }
    
    init(light: UIColor, dark: UIColor) {
        self.init(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? dark : light
        })
    }
}
