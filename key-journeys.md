# Key journeys

This document captures the **critical user journeys** that must not regress as we ship to app stores.

> **See also:** [`docs/CORE-FLOWS.md`](docs/CORE-FLOWS.md) for detailed flow definitions with test data and assertions.

## 1) First launch (no secrets / signed out)

**Goal:** app opens without crashing and shows a sensible signed-out experience.

- Android: shows the app shell/title and a signed-out/missing-config state if `CLERK_PUBLISHABLE_KEY` is not provided.
- iOS: shows **Welcome** and the `CLERK_PUBLISHABLE_KEY` setup hint when the key is not configured.

**Regression tests:**
- Android: `tally-android/app/src/androidTest/.../CoreFlowInstrumentedTest.launch_showsAppTitle`
- iOS: `tally-ios/TallyAppUITests/SmokeUITests.swift::testLaunch_showsWelcomeWhenMissingClerkKey`

## 2) Sign in / sign up

**Goal:** user can authenticate and arrive at the main app.

Steps:
1. Open app
2. Sign in or create account
3. Land on Challenges (or equivalent home)

**Notes:** requires real Clerk keys + a test account (keep secrets out of CI).

**Regression tests:**
- Web: `tally-web/tests/e2e/core-flows.spec.ts::FLOW-002`
- iOS: `tally-ios/TallyAppUITests/CoreFlowUITests.swift::testFLOW002_signIn`
- Android: `tally-android/.../CoreFlowInstrumentedTest.kt::testFLOW002_signIn`

## 3) Create a challenge

**Goal:** user can create a new challenge with a name + target and see it in their list.

Steps:
1. Tap "New challenge"
2. Enter name + target
3. Create
4. Challenge appears in list

**Regression tests:**
- Web: `tally-web/tests/e2e/core-flows.spec.ts::FLOW-003`
- iOS: `tally-ios/TallyAppUITests/CoreFlowUITests.swift::testFLOW003_createChallenge`
- Android: `tally-android/.../CoreFlowInstrumentedTest.kt::testFLOW003_createChallenge`

## 4) Add an entry

**Goal:** user can record progress and see totals update.

Steps:
1. Open a challenge
2. Tap "Add entry"
3. Add count/date
4. Entry appears; totals/stats update

**Regression tests:**
- Web: `tally-web/tests/e2e/core-flows.spec.ts::FLOW-004`
- iOS: `tally-ios/TallyAppUITests/CoreFlowUITests.swift::testFLOW004_addEntry`
- Android: `tally-android/.../CoreFlowInstrumentedTest.kt::testFLOW004_addEntry`

## 5) Review progress

**Goal:** user can quickly understand where they stand.

Signals:
- Current progress vs target
- Recent entries
- (If enabled) streaks

**Regression tests:**
- Web: `tally-web/tests/e2e/core-flows.spec.ts::FLOW-006`
- iOS: `tally-ios/TallyAppUITests/CoreFlowUITests.swift::testFLOW006_dashboardTrends`
- Android: `tally-android/.../CoreFlowInstrumentedTest.kt::testFLOW006_dashboardTrends`

## 6) Manage challenge

**Goal:** user can edit/archive/delete (as applicable) and the UI stays consistent.

**Regression tests:**
- Web: `tally-web/tests/e2e/core-flows.spec.ts::FLOW-005`
- iOS: `tally-ios/TallyAppUITests/CoreFlowUITests.swift::testFLOW005_editChallenge`
- Android: `tally-android/.../CoreFlowInstrumentedTest.kt::testFLOW005_editChallenge`

## 7) View community challenge

**Goal:** user can browse and view public challenges shared by other users.

Steps:
1. Navigate to Community/Explore section
2. View list of public challenges
3. Tap to view challenge details
4. See challenge info without editing capabilities

**Regression tests:**
- Web: `tally-web/tests/e2e/core-flows.spec.ts::FLOW-007`
- iOS: `tally-ios/TallyAppUITests/CoreFlowUITests.swift::testFLOW007_viewCommunityChallenge`
- Android: `tally-android/.../CoreFlowInstrumentedTest.kt::testFLOW007_viewCommunityChallenge`

## 8) Export data

**Goal:** user can export their data for backup or portability.

Steps:
1. Navigate to Settings
2. Find Export option
3. Export data (JSON/CSV)
4. Verify download/share completes

**Regression tests:**
- Web: `tally-web/tests/e2e/core-flows.spec.ts::FLOW-008`
- iOS: `tally-ios/TallyAppUITests/CoreFlowUITests.swift::testFLOW008_exportData`
- Android: `tally-android/.../CoreFlowInstrumentedTest.kt::testFLOW008_exportData`

## 9) Import data

**Goal:** user can import previously exported data.

Steps:
1. Navigate to Settings
2. Find Import option
3. Select file to import
4. Verify data appears in app

**Regression tests:**
- Web: `tally-web/tests/e2e/core-flows.spec.ts::FLOW-009`
- iOS: `tally-ios/TallyAppUITests/CoreFlowUITests.swift::testFLOW009_importData`
- Android: `tally-android/.../CoreFlowInstrumentedTest.kt::testFLOW009_importData`

## 10) Sign out

**Goal:** user can sign out and the app returns to a signed-out state.

Steps:
1. Navigate to Settings/Profile
2. Tap Sign Out
3. Confirm if prompted
4. App shows signed-out state

**Regression tests:**
- Web: `tally-web/tests/e2e/core-flows.spec.ts::FLOW-010`
- iOS: `tally-ios/TallyAppUITests/CoreFlowUITests.swift::testFLOW010_signOut`
- Android: `tally-android/.../CoreFlowInstrumentedTest.kt::testFLOW010_signOut`

## 11) Data persistence across login

**Goal:** user's data persists after signing out and back in.

Steps:
1. Create challenge with unique name
2. Sign out
3. Sign back in
4. Verify challenge still exists

**Regression tests:**
- Web: `tally-web/tests/e2e/core-flows.spec.ts::FLOW-011`
- iOS: `tally-ios/TallyAppUITests/CoreFlowUITests.swift::testFLOW011_dataPersistence`
- Android: `tally-android/.../CoreFlowInstrumentedTest.kt::testFLOW011_dataPersistence`

## Running the regression suite

### Web

```bash
cd tally-web
TEST_USER_EMAIL=your@email.com TEST_USER_PASSWORD=yourpass bun run test:e2e
```

### Android

```bash
cd tally-android
CLERK_PUBLISHABLE_KEY_DEV=pk_test_... ./gradlew connectedAndroidTest
```

### iOS

```bash
cd tally-ios
xcodegen generate
xcodebuild test -project Tally.xcodeproj -scheme Tally \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  -only-testing:TallyUITests
```

**Note:** Authenticated tests require valid Clerk credentials. Tests gracefully skip when credentials are not configured.
