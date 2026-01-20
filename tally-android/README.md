# Tally Android

Android app for Tally, built with Jetpack Compose and Material 3.

## Requirements

- Android Studio Ladybug or later (or Android SDK 35+)
- JDK 17+
- Gradle 8.10+

## Project Structure

```
tally-android/
├── app/                    # Main application module
│   └── src/main/
│       ├── java/com/tally/app/
│       │   ├── MainActivity.kt      # Entry point
│       │   ├── TallyApp.kt          # App shell with navigation
│       │   └── ui/                  # Screen composables
│       └── res/                     # Resources
├── core/
│   └── design/             # Design system module
│       └── src/main/java/com/tally/core/design/
│           ├── TallyTheme.kt        # Material 3 theme
│           ├── TallyColors.kt       # Color tokens
│           ├── TallyTypography.kt   # Typography scale
│           ├── TallySpacing.kt      # Spacing tokens
│           ├── TallyMotion.kt       # Animation timing
│           ├── TallyMark.kt         # Fractal completion tally component
│           └── SyncStatusIndicator.kt
└── gradle/                 # Gradle wrapper and version catalog
```

## Building

```bash
# Set Android SDK location (if not in ANDROID_HOME)
export ANDROID_HOME=~/Library/Android/sdk

# Build debug APK
./gradlew assembleDebug

# Output: app/build/outputs/apk/debug/app-debug.apk
```

## Design System

### TallyMark Composable

The `TallyMark` composable renders counts using the fractal completion tally system:

- **1-4**: Vertical strokes
- **5**: 5-gate (4 strokes + diagonal slash in accent color)
- **6-24**: Multiple 5-gates in X layout
- **25**: Full 25-unit with C2 X overlay
- **26-99**: 2x2 grid of 25-units
- **100**: Collapsed to X + square outline
- **101-999**: Row of 100-blocks
- **1000+**: Rows with horizontal line overlay

```kotlin
TallyMark(
    count = 27,
    modifier = Modifier.size(64.dp),
    animated = true
)
```

### Accessibility

- Respects "Remove animations" system setting via `LocalReduceMotion`
- TalkBack content descriptions for tally marks
- Large text support via Material 3 typography

### Theming

- Material 3 with dynamic color (Material You) support
- Fallback to custom Tally color scheme
- Light/dark mode auto-detection
