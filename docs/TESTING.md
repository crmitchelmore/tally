# Tally Testing Guide

This document describes the testing strategy and setup for each platform.

## Web (tally-web/)

### Unit Tests (Vitest)

```bash
cd tally-web
bun run test
```

Test files are located in `src/**/*.test.ts`:
- `src/lib/adapters.test.ts` - Type converter tests
- `src/lib/stats.test.ts` - Statistics calculation tests
- `src/lib/weeklySummary.test.ts` - Weekly summary logic tests
- `src/lib/exportImport.test.ts` - Export/import format tests

Configuration: `vitest.config.ts`

### E2E Tests (Playwright)

```bash
cd tally-web
bun run test:e2e        # Run all E2E tests
bun run test:e2e:ui     # Run with Playwright UI
```

Test files in `tests/e2e/`:
- `smoke.spec.ts` - Basic rendering and navigation
- `auth.spec.ts` - Authentication flows (requires credentials)
- `dashboard.spec.ts` - Dashboard features and snapshots
- `ui-report.spec.ts` - UI consistency tests

Configuration: `playwright.config.ts`
- Parallel execution enabled (`fullyParallel: true`)
- 4 workers in CI
- Chromium + mobile viewport projects
- Screenshots stored in `tests/e2e/__screenshots__/`

#### Running Authenticated Tests

Set environment variables for auth tests:
```bash
export E2E_CLERK_EMAIL="test@example.com"
export E2E_CLERK_PASSWORD="password"
bun run test:e2e
```

## iOS (tally-ios/)

### Unit Tests (XCTest)

```bash
cd tally-ios
xcodebuild test \
  -scheme Tally \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -only-testing:TallyTests
```

Test files:
- `TallyAppTests/TallyAppTests.swift` - App-level validation tests
- `TallyCore/Tests/TallyCoreTests/TallyCoreTests.swift` - Model and API tests

### TallyCore Tests

The TallyCore Swift Package includes comprehensive tests for:
- Model decoding (Challenge, Entry, FollowedChallenge)
- Type serialization (FeelingType, TimeframeUnit)
- API request encoding (CreateEntry, UpdateChallenge, etc.)
- API response decoding (IdResponse, SuccessResponse, LeaderboardRow)

### UI Tests (XCUITest)

To run UI tests, add a TallyAppUITests target to `project.yml`:

```yaml
TallyUITests:
  type: bundle.ui-testing
  platform: iOS
  sources:
    - path: TallyAppUITests
  dependencies:
    - target: Tally
```

Then create `TallyAppUITests/TallyAppUITests.swift` with XCUITest tests.

## Android (tally-android/)

### Unit Tests (JUnit)

```bash
cd tally-android
./gradlew test
```

Test directory: `app/src/test/java/app/tally/`

Dependencies added to `build.gradle.kts`:
```kotlin
testImplementation("junit:junit:4.13.2")
testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.8.1")
testImplementation("io.mockk:mockk:1.13.9")
```

### Instrumented Tests (Compose UI)

```bash
cd tally-android
./gradlew connectedAndroidTest
```

Test directory: `app/src/androidTest/java/app/tally/`

Dependencies added to `build.gradle.kts`:
```kotlin
androidTestImplementation("androidx.test.ext:junit:1.2.1")
androidTestImplementation("androidx.test.espresso:espresso-core:3.6.1")
androidTestImplementation("androidx.compose.ui:ui-test-junit4")
debugImplementation("androidx.compose.ui:ui-test-manifest")
```

### Creating Android Tests

1. Create test directory:
   ```bash
   mkdir -p app/src/test/java/app/tally
   mkdir -p app/src/androidTest/java/app/tally
   ```

2. Add unit test (example):
   ```kotlin
   // app/src/test/java/app/tally/TallyViewModelTest.kt
   package app.tally

   import org.junit.Test
   import org.junit.Assert.*

   class TallyViewModelTest {
     @Test
     fun testInitialState() {
       val state = TallyUiState()
       assertTrue(state.challenges.isEmpty())
       assertFalse(state.isLoading)
     }
   }
   ```

3. Add instrumented test (example):
   ```kotlin
   // app/src/androidTest/java/app/tally/TallyAppTest.kt
   package app.tally

   import androidx.compose.ui.test.junit4.createComposeRule
   import androidx.compose.ui.test.onNodeWithText
   import org.junit.Rule
   import org.junit.Test

   class TallyAppTest {
     @get:Rule
     val composeRule = createComposeRule()

     @Test
     fun loginScreenDisplays() {
       // Test will set content and verify UI
     }
   }
   ```

## CI/CD Integration

### GitHub Actions

Tests run automatically on pull requests:

```yaml
# .github/workflows/test.yml
jobs:
  web-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: cd tally-web && bun install
      - run: cd tally-web && bun run test
      - run: cd tally-web && bun run test:e2e

  ios-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd tally-ios && xcodebuild test ...

  android-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: cd tally-android && ./gradlew test
```

## Snapshot Testing

### Web (Playwright)

Snapshots are stored in `tests/e2e/__screenshots__/` and compared automatically.

Update snapshots:
```bash
bun run test:e2e --update-snapshots
```

### iOS (XCTest)

Use `XCTAssertEqual` with recorded data or implement a snapshot library.

### Android (Compose)

Use Android's Screenshot Testing library or Paparazzi for Compose snapshots.

## Test Tagging

Tests can be tagged for selective execution:

- `@ui` - Visual/snapshot tests
- `@auth` - Tests requiring authentication
- `@slow` - Long-running tests

Run specific tags:
```bash
bun run test:e2e --grep @ui
```

## Coverage

### Web
```bash
bun run test -- --coverage
```

### iOS
Enable code coverage in Xcode scheme settings.

### Android
```bash
./gradlew testDebugUnitTestCoverage
```
