package com.tally.core.design

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

/**
 * Tally color tokens following the design philosophy:
 * - Paper background (slightly off-white)
 * - Ink colors (C1, C2, C3) for fractal completion tallies
 * - Warm red accent for 5th tally mark slash
 */
object TallyColors {
    // Paper backgrounds (light/dark)
    val PaperLight = Color(0xFFFAF9F7)  // Warm off-white
    val PaperDark = Color(0xFF1A1A1A)   // Near black

    // Ink colors for light mode (C1 base, C2 mid cap, C3 high cap)
    val InkC1Light = Color(0xFF2D2D2D)      // Primary ink (tallies/5-gates)
    val InkC2Light = Color(0xFF5A5A5A)      // Mid cap (25-cap X overlay)
    val InkC3Light = Color(0xFF8A8A8A)      // High cap (100-cap box outline)

    // Ink colors for dark mode
    val InkC1Dark = Color(0xFFE8E8E8)
    val InkC2Dark = Color(0xFFB8B8B8)
    val InkC3Dark = Color(0xFF888888)

    // Warm red accent (the signature 5th tally slash)
    val AccentLight = Color(0xFFCC4433)
    val AccentDark = Color(0xFFE85544)

    // Secondary/tertiary text
    val TextSecondaryLight = Color(0xFF666666)
    val TextSecondaryDark = Color(0xFFAAAAAA)

    // Surface colors
    val SurfaceLight = Color(0xFFFFFFFF)
    val SurfaceDark = Color(0xFF242424)

    // Border colors
    val BorderLight = Color(0xFFE0E0E0)
    val BorderDark = Color(0xFF3A3A3A)

    // Composable accessors for dynamic dark/light mode
    @Composable
    fun paper(): Color = if (isSystemInDarkTheme()) PaperDark else PaperLight

    @Composable
    fun inkC1(): Color = if (isSystemInDarkTheme()) InkC1Dark else InkC1Light

    @Composable
    fun inkC2(): Color = if (isSystemInDarkTheme()) InkC2Dark else InkC2Light

    @Composable
    fun inkC3(): Color = if (isSystemInDarkTheme()) InkC3Dark else InkC3Light

    @Composable
    fun accent(): Color = if (isSystemInDarkTheme()) AccentDark else AccentLight

    @Composable
    fun textSecondary(): Color = if (isSystemInDarkTheme()) TextSecondaryDark else TextSecondaryLight

    @Composable
    fun surface(): Color = if (isSystemInDarkTheme()) SurfaceDark else SurfaceLight

    @Composable
    fun border(): Color = if (isSystemInDarkTheme()) BorderDark else BorderLight
}
