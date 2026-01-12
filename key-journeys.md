# Key journeys

This document captures the **critical user journeys** that must not regress as we ship to app stores.

## 1) First launch (no secrets / signed out)

**Goal:** app opens without crashing and shows a sensible signed-out experience.

- Android: shows the app shell/title and a signed-out/missing-config state if `CLERK_PUBLISHABLE_KEY` is not provided.
- iOS: shows **Welcome** and the `CLERK_PUBLISHABLE_KEY` setup hint when the key is not configured.

**Regression tests:**
- Android: `tally-android/app/src/androidTest/.../TallyAppInstrumentedTest.launch_showsAppTitle`
- iOS: `tally-ios/TallyAppUITests.testLaunch_showsWelcomeWhenMissingClerkKey`

## 2) Sign in / sign up

**Goal:** user can authenticate and arrive at the main app.

Steps:
1. Open app
2. Sign in or create account
3. Land on Challenges (or equivalent home)

**Notes:** requires real Clerk keys + a test account (keep secrets out of CI).

## 3) Create a challenge

**Goal:** user can create a new challenge with a name + target and see it in their list.

Steps:
1. Tap “New challenge”
2. Enter name + target
3. Create
4. Challenge appears in list

## 4) Add an entry

**Goal:** user can record progress and see totals update.

Steps:
1. Open a challenge
2. Tap “Add entry”
3. Add count/date
4. Entry appears; totals/stats update

## 5) Review progress

**Goal:** user can quickly understand where they stand.

Signals:
- Current progress vs target
- Recent entries
- (If enabled) streaks

## 6) Manage challenge

**Goal:** user can edit/archive/delete (as applicable) and the UI stays consistent.

## 7) Sign out

**Goal:** user can sign out and the app returns to a signed-out state.

## Running the mobile regression suite

### Android

```bash
nx run tally-android:e2e
```

### iOS

```bash
nx run tally-ios:e2e
```

(These commands generate/build the native projects via XcodeGen/Gradle and run simulator/emulator-driven smoke tests.)
