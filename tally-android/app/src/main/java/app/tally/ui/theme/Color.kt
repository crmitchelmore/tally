package app.tally.ui.theme

import androidx.compose.ui.graphics.Color

/**
 * Tally Design System - Colors
 *
 * Semantic colors matching the cross-platform design tokens.
 * Colors are defined for both light and dark modes.
 */
object TallyColors {

    // Brand Colors
    val Ink = Color(0xFF3D3835)          // oklch(0.25 0.02 30)
    val Slash = Color(0xFFC2594A)        // oklch(0.55 0.22 25) - warm accent
    val Focus = Color(0xFF4D80CC)        // oklch(0.5 0.2 240)

    // Status Colors - Light Mode
    val StatusAheadLight = Color(0xFF339957)    // oklch(0.45 0.18 145)
    val StatusOnPaceLight = Color(0xFFA68D33)   // oklch(0.55 0.15 90)
    val StatusBehindLight = Color(0xFFC2594A)   // oklch(0.55 0.22 25)
    val StatusStreakLight = Color(0xFFD98033)   // oklch(0.6 0.2 50)

    // Status Colors - Dark Mode
    val StatusAheadDark = Color(0xFF47B36B)     // oklch(0.55 0.18 145)
    val StatusOnPaceDark = Color(0xFFBFA347)    // oklch(0.65 0.15 90)
    val StatusBehindDark = Color(0xFFD96B5C)    // oklch(0.65 0.22 25)
    val StatusStreakDark = Color(0xFFE68F3D)    // oklch(0.65 0.2 50)

    // Heatmap Colors - Light Mode
    val Heatmap0Light = Color(0xFFF0EFEE)       // oklch(0.94 0.006 50)
    val Heatmap1Light = Color(0xFFBF9980)       // oklch(0.75 0.08 35)
    val Heatmap2Light = Color(0xFF997359)       // oklch(0.6 0.12 35)
    val Heatmap3Light = Color(0xFF735240)       // oklch(0.45 0.15 35)
    val Heatmap4Light = Color(0xFF4D3328)       // oklch(0.3 0.18 35)

    // Heatmap Colors - Dark Mode
    val Heatmap0Dark = Color(0xFF403D3B)        // oklch(0.25 0.006 50)
    val Heatmap1Dark = Color(0xFF594C45)        // oklch(0.35 0.08 35)
    val Heatmap2Dark = Color(0xFF735F52)        // oklch(0.45 0.12 35)
    val Heatmap3Dark = Color(0xFF8C735F)        // oklch(0.55 0.15 35)
    val Heatmap4Dark = Color(0xFFA68873)        // oklch(0.65 0.18 35)

    // Record Colors (consistent across themes)
    val RecordBestDay = Color(0xFFCC9933)       // oklch(0.65 0.24 60)
    val RecordStreak = Color(0xFFC2594A)        // oklch(0.55 0.22 25)
    val RecordAverage = Color(0xFF339957)       // oklch(0.45 0.18 145)
    val RecordActive = Color(0xFF6659B3)        // oklch(0.5 0.2 260)
    val RecordEntry = Color(0xFF8C59BF)         // oklch(0.55 0.25 280)
    val RecordMilestone = Color(0xFFCC7340)     // oklch(0.6 0.22 40)
    val RecordMaxReps = Color(0xFFCC6640)       // oklch(0.58 0.26 30)

    // Chart Colors - Light Mode
    val ChartGridLight = Color(0xFFD9D6D3)      // oklch(0.85 0.01 50)
    val ChartAxisLight = Color(0xFF807D7A)      // oklch(0.5 0.01 30)
    val ChartTooltipBgLight = Color(0xFFFCFBFA) // oklch(0.99 0.002 50)
    val ChartTooltipBorderLight = Color(0xFFD9D6D3)
    val ChartTargetLineLight = Color(0xFFB3B0AD) // oklch(0.7 0.01 30)

    // Chart Colors - Dark Mode
    val ChartGridDark = Color(0xFF595653)       // oklch(0.35 0.01 50)
    val ChartAxisDark = Color(0xFF999693)       // oklch(0.6 0.01 30)
    val ChartTooltipBgDark = Color(0xFF403D3B)  // oklch(0.25 0.002 50)
    val ChartTooltipBorderDark = Color(0xFF595653)
    val ChartTargetLineDark = Color(0xFF807D7A) // oklch(0.5 0.01 30)

    // Surface Colors
    val CardBackgroundLight = Color.White
    val CardBackgroundDark = Color(0xFF262422)
    val CardBorderLight = Color(0xFFE6E3E0)
    val CardBorderDark = Color(0xFF403D3B)
}
