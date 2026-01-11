import SwiftUI

/// Tally Design System - Spacing
///
/// Consistent spacing based on 8pt grid.
public enum TallySpacing {
    public static let xs: CGFloat = 4
    public static let sm: CGFloat = 8
    public static let md: CGFloat = 16
    public static let lg: CGFloat = 24
    public static let xl: CGFloat = 32
    public static let xxl: CGFloat = 48
    public static let xxxl: CGFloat = 64
}

/// Tally Design System - Border Radii
public enum TallyRadius {
    public static let sm: CGFloat = 4
    public static let md: CGFloat = 8
    public static let lg: CGFloat = 12
    public static let xl: CGFloat = 16
    public static let xxl: CGFloat = 24
}

/// Tally Design System - Motion
public enum TallyMotion {
    public static let fast: Double = 0.12
    public static let normal: Double = 0.22
    public static let slow: Double = 0.32
    public static let hero: Double = 0.42
    
    /// Check if reduced motion is enabled
    public static var reducedMotionEnabled: Bool {
        UIAccessibility.isReduceMotionEnabled
    }
    
    /// Get duration respecting reduced motion preference
    public static func duration(_ value: Double) -> Double {
        reducedMotionEnabled ? 0 : value
    }
}
