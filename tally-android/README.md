# Tally Android

Android app for Tally, built with Jetpack Compose and Material 3. Uses Clerk web OAuth, offline-first caching, and the shared REST API.

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
│   ├── auth/               # Clerk OAuth + token storage
│   ├── billing/            # Tip jar (Google Play Billing)
│   ├── data/               # Offline-first stores + sync manager
│   ├── design/             # Design system module
│   ├── network/            # REST API client + models
│   └── telemetry/          # PostHog + structured logging
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

## Configuration
- `CLERK_PUBLISHABLE_KEY` and `API_BASE_URL` are read from env vars at build time.
- Defaults fall back to production values if env vars are unset.

## Auth + API
- `core/auth` uses Clerk hosted sign-in via CustomTabs and deep link callback (`tally://auth/callback`).
- Tokens stored in `EncryptedSharedPreferences`.
- `core/network` provides typed REST client (`TallyApiClient`) using Bearer auth.

## Known API mismatches (audit)
- `TallyApiClient` uses snake_case query params (e.g., `challenge_id`, `start_date`) while the web API expects camelCase (e.g., `challengeId`, `startDate`).
- Some endpoints referenced by `TallyApiClient` are not implemented on the server (e.g., `/api/v1/stats/dashboard`, `/api/v1/stats/records`, `/api/v1/data/export`, `/api/v1/data/import`).

## Offline-first data
- `core/data/ChallengesManager` loads cached challenges/entries immediately, then syncs in background.
- Pending entry changes are queued and retried.

## Tip Jar
- `core/billing` implements consumable tips via Google Play Billing (`TipManager`, `TipJarScreen`).

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
