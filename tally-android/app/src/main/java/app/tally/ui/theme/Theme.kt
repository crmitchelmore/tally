package app.tally.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

/**
 * Tally Light Color Scheme
 *
 * Based on "Ink + Momentum" design direction:
 * - Neutral base with warm accents
 * - One warm accent (brand slash) used sparingly for primary actions
 */
private val LightColorScheme = lightColorScheme(
    primary = TallyColors.Slash,
    onPrimary = Color.White,
    primaryContainer = TallyColors.Slash.copy(alpha = 0.1f),
    onPrimaryContainer = TallyColors.Ink,

    secondary = TallyColors.Ink,
    onSecondary = Color.White,
    secondaryContainer = TallyColors.Ink.copy(alpha = 0.1f),
    onSecondaryContainer = TallyColors.Ink,

    tertiary = TallyColors.StatusAheadLight,
    onTertiary = Color.White,
    tertiaryContainer = TallyColors.StatusAheadLight.copy(alpha = 0.1f),
    onTertiaryContainer = TallyColors.StatusAheadLight,

    error = TallyColors.StatusBehindLight,
    onError = Color.White,
    errorContainer = TallyColors.StatusBehindLight.copy(alpha = 0.1f),
    onErrorContainer = TallyColors.StatusBehindLight,

    background = Color(0xFFFAF9F8),
    onBackground = TallyColors.Ink,

    surface = Color.White,
    onSurface = TallyColors.Ink,
    surfaceVariant = Color(0xFFF5F4F3),
    onSurfaceVariant = Color(0xFF5C5856),

    outline = TallyColors.CardBorderLight,
    outlineVariant = Color(0xFFE6E3E0),
)

/**
 * Tally Dark Color Scheme
 */
private val DarkColorScheme = darkColorScheme(
    primary = TallyColors.Slash.copy(alpha = 0.9f),
    onPrimary = Color.White,
    primaryContainer = TallyColors.Slash.copy(alpha = 0.2f),
    onPrimaryContainer = Color.White,

    secondary = Color(0xFFE0DEDC),
    onSecondary = TallyColors.Ink,
    secondaryContainer = Color(0xFF3D3A38),
    onSecondaryContainer = Color(0xFFE0DEDC),

    tertiary = TallyColors.StatusAheadDark,
    onTertiary = Color.White,
    tertiaryContainer = TallyColors.StatusAheadDark.copy(alpha = 0.2f),
    onTertiaryContainer = TallyColors.StatusAheadDark,

    error = TallyColors.StatusBehindDark,
    onError = Color.White,
    errorContainer = TallyColors.StatusBehindDark.copy(alpha = 0.2f),
    onErrorContainer = TallyColors.StatusBehindDark,

    background = Color(0xFF1A1918),
    onBackground = Color(0xFFE6E4E2),

    surface = Color(0xFF262422),
    onSurface = Color(0xFFE6E4E2),
    surfaceVariant = Color(0xFF3D3A38),
    onSurfaceVariant = Color(0xFFB3B0AD),

    outline = TallyColors.CardBorderDark,
    outlineVariant = Color(0xFF4D4A47),
)

/**
 * Tally Theme
 *
 * Wraps the app with Tally's branded Material3 theme.
 * Supports light/dark mode and dynamic color (when available on Android 12+).
 *
 * Usage:
 * ```kotlin
 * TallyTheme {
 *     // Your app content
 * }
 * ```
 */
@Composable
fun TallyTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = TallyMaterial3Typography,
        content = content
    )
}

/**
 * Spacing constants following 8pt grid
 */
object TallySpacing {
    val Xs = 4
    val Sm = 8
    val Md = 16
    val Lg = 24
    val Xl = 32
    val Xxl = 48
    val Xxxl = 64
}

/**
 * Border radius constants
 */
object TallyRadius {
    val Sm = 4
    val Md = 8
    val Lg = 12
    val Xl = 16
    val Xxl = 24
}
