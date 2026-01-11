// Auto-generated from tokens.json - DO NOT EDIT
// Run: npm run generate:ios in packages/design-tokens

import SwiftUI

// MARK: - Design Tokens

public enum TallyTokens {

    // MARK: - Brand Colors
    public enum Brand {
        /// Tally line color - primary brand mark
        public static let ink = "oklch(0.25 0.02 30)"
        /// Tally cross/slash - warm accent (the 5th tally mark)
        public static let slash = "oklch(0.55 0.22 25)"
        /// Focus ring color for accessibility
        public static let focus = "oklch(0.5 0.2 240)"
    }

    // MARK: - Status Colors
    public enum Status {
        /// Ahead of pace - green
        public static let aheadLight = "oklch(0.45 0.18 145)"
        public static let aheadDark = "oklch(0.55 0.18 145)"
        /// On pace - yellow/amber
        public static let onPaceLight = "oklch(0.55 0.15 90)"
        public static let onPaceDark = "oklch(0.65 0.15 90)"
        /// Behind pace - matches brand slash
        public static let behindLight = "oklch(0.55 0.22 25)"
        public static let behindDark = "oklch(0.65 0.22 25)"
        /// Streak/fire indicator - orange
        public static let streakLight = "oklch(0.6 0.2 50)"
        public static let streakDark = "oklch(0.65 0.2 50)"
    }

    // MARK: - Chart Colors
    public enum Chart {
        public static let gridLight = "oklch(0.85 0.01 50)"
        public static let gridDark = "oklch(0.35 0.01 50)"
        public static let axisLight = "oklch(0.5 0.01 30)"
        public static let axisDark = "oklch(0.6 0.01 30)"
        public static let tooltipBgLight = "oklch(0.99 0.002 50)"
        public static let tooltipBgDark = "oklch(0.25 0.002 50)"
        public static let tooltipBorderLight = "oklch(0.85 0.01 50)"
        public static let tooltipBorderDark = "oklch(0.35 0.01 50)"
        public static let targetLineLight = "oklch(0.7 0.01 30)"
        public static let targetLineDark = "oklch(0.5 0.01 30)"
    }

    // MARK: - Heatmap Colors
    public enum Heatmap {
        public static let level0Light = "oklch(0.94 0.006 50)"
        public static let level0Dark = "oklch(0.25 0.006 50)"
        public static let level1Light = "oklch(0.75 0.08 35)"
        public static let level1Dark = "oklch(0.35 0.08 35)"
        public static let level2Light = "oklch(0.6 0.12 35)"
        public static let level2Dark = "oklch(0.45 0.12 35)"
        public static let level3Light = "oklch(0.45 0.15 35)"
        public static let level3Dark = "oklch(0.55 0.15 35)"
        public static let level4Light = "oklch(0.3 0.18 35)"
        public static let level4Dark = "oklch(0.65 0.18 35)"
    }

    // MARK: - Record Colors
    public enum Records {
        public static let bestDay = "oklch(0.65 0.24 60)"
        public static let streak = "oklch(0.55 0.22 25)"
        public static let average = "oklch(0.45 0.18 145)"
        public static let active = "oklch(0.5 0.2 260)"
        public static let entry = "oklch(0.55 0.25 280)"
        public static let milestone = "oklch(0.6 0.22 40)"
        public static let maxReps = "oklch(0.58 0.26 30)"
    }

    // MARK: - Spacing
    public enum Spacing {
        public static let unit: CGFloat = 8
        public static let xs: CGFloat = 4
        public static let sm: CGFloat = 8
        public static let md: CGFloat = 16
        public static let lg: CGFloat = 24
        public static let xl: CGFloat = 32
        public static let _2xl: CGFloat = 48
        public static let _3xl: CGFloat = 64
    }

    // MARK: - Corner Radii
    public enum Radii {
        public static let sm: CGFloat = 4
        public static let md: CGFloat = 8
        public static let lg: CGFloat = 12
        public static let xl: CGFloat = 16
        public static let _2xl: CGFloat = 24
        public static let full: CGFloat = 9999
    }

    // MARK: - Motion
    public enum Motion {
        public enum Duration {
            public static let fast: Double = 0.12
            public static let normal: Double = 0.22
            public static let slow: Double = 0.32
            public static let hero: Double = 0.42
        }
    }
}

// MARK: - Color Extension

extension Color {
    /// Parse oklch color string (simplified - uses system colors as fallback)
    public init(oklch: String) {
        // TODO: Implement proper oklch parsing
        // For now, this is a placeholder that needs proper implementation
        self = .primary
    }
}
