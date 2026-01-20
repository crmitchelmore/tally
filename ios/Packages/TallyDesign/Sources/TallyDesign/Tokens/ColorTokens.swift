import SwiftUI

public extension Color {
    /// OKLCH-based color tokens for Tally
    /// Following design philosophy: paper background, ink strokes, accent red
    
    // MARK: - Paper (Background)
    
    /// Off-white paper background (light mode)
    /// OKLCH(98% 0.005 100) approximation
    static let tallyPaper = Color(
        light: Color(red: 0.98, green: 0.98, blue: 0.97),
        dark: Color(red: 0.11, green: 0.11, blue: 0.12)
    )
    
    /// Subtle paper texture tint
    static let tallyPaperTint = Color(
        light: Color(red: 0.95, green: 0.95, blue: 0.94),
        dark: Color(red: 0.14, green: 0.14, blue: 0.15)
    )
    
    // MARK: - Ink (Foreground)
    
    /// Primary ink color for strokes and text
    /// C1 - base detail color
    static let tallyInk = Color(
        light: Color(red: 0.15, green: 0.15, blue: 0.16),
        dark: Color(red: 0.92, green: 0.92, blue: 0.93)
    )
    
    /// Secondary ink for mid-level detail
    /// C2 - mid cap color (25-cap X overlay)
    static let tallyInkSecondary = Color(
        light: Color(red: 0.35, green: 0.35, blue: 0.37),
        dark: Color(red: 0.72, green: 0.72, blue: 0.73)
    )
    
    /// Tertiary ink for subtle elements
    /// C3 - high cap color (100-cap box outline)
    static let tallyInkTertiary = Color(
        light: Color(red: 0.55, green: 0.55, blue: 0.57),
        dark: Color(red: 0.52, green: 0.52, blue: 0.53)
    )
    
    // MARK: - Accent
    
    /// Warm red accent - the signature diagonal slash (5th tally mark)
    /// Used sparingly for CTAs, highlights, completion moments
    static let tallyAccent = Color(
        light: Color(red: 0.85, green: 0.25, blue: 0.20),
        dark: Color(red: 0.95, green: 0.35, blue: 0.30)
    )
    
    /// Subtle accent for backgrounds
    static let tallyAccentSubtle = Color(
        light: Color(red: 0.98, green: 0.92, blue: 0.91),
        dark: Color(red: 0.25, green: 0.15, blue: 0.14)
    )
    
    // MARK: - Semantic Colors
    
    /// Success state
    static let tallySuccess = Color(
        light: Color(red: 0.20, green: 0.70, blue: 0.35),
        dark: Color(red: 0.30, green: 0.80, blue: 0.45)
    )
    
    /// Warning state
    static let tallyWarning = Color(
        light: Color(red: 0.90, green: 0.60, blue: 0.10),
        dark: Color(red: 0.95, green: 0.70, blue: 0.20)
    )
    
    /// Error state
    static let tallyError = Color(
        light: Color(red: 0.85, green: 0.20, blue: 0.15),
        dark: Color(red: 0.95, green: 0.30, blue: 0.25)
    )
}

// MARK: - Helpers

public extension Color {
    /// Create a color that adapts to light/dark mode
    init(light: Color, dark: Color) {
        self.init(uiColor: UIColor { traits in
            traits.userInterfaceStyle == .dark ? UIColor(dark) : UIColor(light)
        })
    }
}
