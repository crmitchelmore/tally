// Auto-generated from tokens.json - DO NOT EDIT
// Run: npm run generate:android in packages/design-tokens

package app.tally.core.design

import androidx.compose.ui.unit.dp

/**
 * Tally Design Tokens
 * Cross-platform design tokens for consistent styling.
 */
object TallyTokens {

    // MARK: - Brand Colors
    object Brand {
        /** Tally line color - primary brand mark */
        const val ink = "oklch(0.25 0.02 30)"
        /** Tally cross/slash - warm accent (the 5th tally mark) */
        const val slash = "oklch(0.55 0.22 25)"
        /** Focus ring color for accessibility */
        const val focus = "oklch(0.5 0.2 240)"
    }

    // MARK: - Status Colors
    object Status {
        /** Ahead of pace - green */
        const val aheadLight = "oklch(0.45 0.18 145)"
        const val aheadDark = "oklch(0.55 0.18 145)"
        /** On pace - yellow/amber */
        const val onPaceLight = "oklch(0.55 0.15 90)"
        const val onPaceDark = "oklch(0.65 0.15 90)"
        /** Behind pace - matches brand slash */
        const val behindLight = "oklch(0.55 0.22 25)"
        const val behindDark = "oklch(0.65 0.22 25)"
        /** Streak/fire indicator - orange */
        const val streakLight = "oklch(0.6 0.2 50)"
        const val streakDark = "oklch(0.65 0.2 50)"
    }

    // MARK: - Chart Colors
    object Chart {
        const val gridLight = "oklch(0.85 0.01 50)"
        const val gridDark = "oklch(0.35 0.01 50)"
        const val axisLight = "oklch(0.5 0.01 30)"
        const val axisDark = "oklch(0.6 0.01 30)"
        const val tooltipBgLight = "oklch(0.99 0.002 50)"
        const val tooltipBgDark = "oklch(0.25 0.002 50)"
        const val tooltipBorderLight = "oklch(0.85 0.01 50)"
        const val tooltipBorderDark = "oklch(0.35 0.01 50)"
        const val targetLineLight = "oklch(0.7 0.01 30)"
        const val targetLineDark = "oklch(0.5 0.01 30)"
    }

    // MARK: - Heatmap Colors
    object Heatmap {
        const val level0Light = "oklch(0.94 0.006 50)"
        const val level0Dark = "oklch(0.25 0.006 50)"
        const val level1Light = "oklch(0.75 0.08 35)"
        const val level1Dark = "oklch(0.35 0.08 35)"
        const val level2Light = "oklch(0.6 0.12 35)"
        const val level2Dark = "oklch(0.45 0.12 35)"
        const val level3Light = "oklch(0.45 0.15 35)"
        const val level3Dark = "oklch(0.55 0.15 35)"
        const val level4Light = "oklch(0.3 0.18 35)"
        const val level4Dark = "oklch(0.65 0.18 35)"
    }

    // MARK: - Record Colors
    object Records {
        const val bestDay = "oklch(0.65 0.24 60)"
        const val streak = "oklch(0.55 0.22 25)"
        const val average = "oklch(0.45 0.18 145)"
        const val active = "oklch(0.5 0.2 260)"
        const val entry = "oklch(0.55 0.25 280)"
        const val milestone = "oklch(0.6 0.22 40)"
        const val maxReps = "oklch(0.58 0.26 30)"
    }

    // MARK: - Spacing
    object Spacing {
        val unit = 8.dp
        val xs = 4.dp
        val sm = 8.dp
        val md = 16.dp
        val lg = 24.dp
        val xl = 32.dp
        val _2xl = 48.dp
        val _3xl = 64.dp
    }

    // MARK: - Corner Radii
    object Radii {
        val sm = 4.dp
        val md = 8.dp
        val lg = 12.dp
        val xl = 16.dp
        val _2xl = 24.dp
        val full = 9999.dp
    }

    // MARK: - Motion
    object Motion {
        object Duration {
            const val fast = 120L // ms
            const val normal = 220L // ms
            const val slow = 320L // ms
            const val hero = 420L // ms
        }
        object Easing {
            const val default = "cubic-bezier(0.4, 0, 0.2, 1)"
            const val easeIn = "cubic-bezier(0.4, 0, 1, 1)"
            const val easeOut = "cubic-bezier(0, 0, 0.2, 1)"
            const val bounce = "cubic-bezier(0.34, 1.56, 0.64, 1)"
        }
    }
}
