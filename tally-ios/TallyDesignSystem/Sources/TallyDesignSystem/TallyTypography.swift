import SwiftUI

/// Tally Design System - Typography
///
/// Typography styles that support Dynamic Type and match cross-platform design.
/// Uses system fonts with semantic sizing for accessibility.
public enum TallyTypography {
    
    // MARK: - Text Styles
    
    /// Large display number (stats, totals)
    public static func largeNumber() -> Font {
        .system(.largeTitle, design: .rounded, weight: .bold)
            .monospacedDigit()
    }
    
    /// Medium number display
    public static func mediumNumber() -> Font {
        .system(.title2, design: .rounded, weight: .semibold)
            .monospacedDigit()
    }
    
    /// Small number in compact contexts
    public static func smallNumber() -> Font {
        .system(.body, design: .rounded, weight: .semibold)
            .monospacedDigit()
    }
    
    /// Page/section title
    public static func pageTitle() -> Font {
        .system(.title, weight: .bold)
    }
    
    /// Card/section header
    public static func sectionHeader() -> Font {
        .system(.headline, weight: .semibold)
    }
    
    /// Standard body text
    public static func body() -> Font {
        .system(.body)
    }
    
    /// Secondary/supporting text
    public static func secondary() -> Font {
        .system(.subheadline)
    }
    
    /// Small labels, captions
    public static func caption() -> Font {
        .system(.caption)
    }
    
    /// Uppercase tracking label (like "REMAINING", "DAYS LEFT")
    public static func label() -> Font {
        .system(.caption2, weight: .medium)
    }
}

// MARK: - View Modifiers

public extension View {
    /// Apply large number styling
    func tallyLargeNumber(color: Color = .primary) -> some View {
        self
            .font(TallyTypography.largeNumber())
            .foregroundColor(color)
    }
    
    /// Apply medium number styling
    func tallyMediumNumber(color: Color = .primary) -> some View {
        self
            .font(TallyTypography.mediumNumber())
            .foregroundColor(color)
    }
    
    /// Apply label styling (uppercase, tracking)
    func tallyLabel() -> some View {
        self
            .font(TallyTypography.label())
            .textCase(.uppercase)
            .tracking(1)
            .foregroundColor(.secondary)
    }
}
