package com.tally.core.design

import android.os.Build
import android.provider.Settings
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.compositionLocalOf
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext

/**
 * CompositionLocal for reduced motion preference.
 * Check this before running animations.
 */
val LocalReduceMotion = compositionLocalOf { false }

private val TallyLightColorScheme = lightColorScheme(
    primary = TallyColors.AccentLight,
    onPrimary = TallyColors.PaperLight,
    secondary = TallyColors.InkC2Light,
    onSecondary = TallyColors.PaperLight,
    tertiary = TallyColors.InkC3Light,
    background = TallyColors.PaperLight,
    onBackground = TallyColors.InkC1Light,
    surface = TallyColors.SurfaceLight,
    onSurface = TallyColors.InkC1Light,
    surfaceVariant = TallyColors.PaperLight,
    onSurfaceVariant = TallyColors.TextSecondaryLight,
    outline = TallyColors.BorderLight,
)

private val TallyDarkColorScheme = darkColorScheme(
    primary = TallyColors.AccentDark,
    onPrimary = TallyColors.PaperDark,
    secondary = TallyColors.InkC2Dark,
    onSecondary = TallyColors.PaperDark,
    tertiary = TallyColors.InkC3Dark,
    background = TallyColors.PaperDark,
    onBackground = TallyColors.InkC1Dark,
    surface = TallyColors.SurfaceDark,
    onSurface = TallyColors.InkC1Dark,
    surfaceVariant = TallyColors.PaperDark,
    onSurfaceVariant = TallyColors.TextSecondaryDark,
    outline = TallyColors.BorderDark,
)

/**
 * Tally theme wrapping Material 3 with custom color scheme,
 * typography, and reduced motion support.
 */
@Composable
fun TallyTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val context = LocalContext.current

    // Check system "Remove animations" setting
    val reduceMotion = remember {
        try {
            val scale = Settings.Global.getFloat(
                context.contentResolver,
                Settings.Global.ANIMATOR_DURATION_SCALE,
                1f
            )
            scale == 0f
        } catch (e: Exception) {
            false
        }
    }

    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> TallyDarkColorScheme
        else -> TallyLightColorScheme
    }

    CompositionLocalProvider(LocalReduceMotion provides reduceMotion) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = TallyTypography,
            content = content
        )
    }
}
