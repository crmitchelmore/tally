package com.tally.core.design

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Typography
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.material3.Text

private val LightColors = lightColorScheme(
  primary = Color(0xFFD6453D),
  onPrimary = Color(0xFFFFFFFF),
  surface = Color(0xFFF8F7F2),
  onSurface = Color(0xFF1A1A1A),
  surfaceVariant = Color(0xFFECEAE3),
  onSurfaceVariant = Color(0xFF393734),
  error = Color(0xFFB3261E),
)

private val DarkColors = darkColorScheme(
  primary = Color(0xFFD6453D),
  onPrimary = Color(0xFFFFFFFF),
  surface = Color(0xFF0F0F0F),
  onSurface = Color(0xFFE8E6DF),
  surfaceVariant = Color(0xFF1A1A1A),
  onSurfaceVariant = Color(0xFFCAC6BE),
  error = Color(0xFFF2B8B5),
)

private val TallyTypography = Typography(
  headlineSmall = TextStyle(fontSize = 24.sp, fontWeight = FontWeight.SemiBold),
  bodyLarge = TextStyle(fontSize = 16.sp),
  bodyMedium = TextStyle(fontSize = 14.sp),
)

@Composable
fun TallyTheme(content: @Composable () -> Unit) {
  val isDark = (LocalConfiguration.current.uiMode and android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
    android.content.res.Configuration.UI_MODE_NIGHT_YES
  MaterialTheme(colorScheme = if (isDark) DarkColors else LightColors, typography = TallyTypography) {
    Surface(color = MaterialTheme.colorScheme.surface) { content() }
  }
}

@Composable
fun TallySurface(content: @Composable () -> Unit) {
  Surface(
    modifier = Modifier
      .fillMaxWidth()
      .padding(12.dp)
      .background(MaterialTheme.colorScheme.surfaceVariant),
    tonalElevation = 1.dp,
    content = content
  )
}

@Composable
fun TallyHeading(text: String) {
  Text(text, style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.onSurface)
}

@Composable
fun TallySubtleText(text: String) {
  Text(text, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
}
