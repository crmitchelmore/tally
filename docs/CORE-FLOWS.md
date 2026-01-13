# Core User Flows

This document defines the **canonical user flows** that must be tested across all platforms (Web, iOS, Android). It serves as the single source of truth for E2E test scenarios.

## Flow Definitions

Each flow includes:
- **ID**: Unique identifier for cross-referencing
- **Preconditions**: Required state before the flow
- **Steps**: User actions in order
- **Assertions**: What to verify after each step
- **Test Data**: Sample values for testing

---

## Authentication Flows

### FLOW-001: First Launch (Signed Out)

**Preconditions:** Fresh app install, no stored credentials

**Steps:**
1. Launch app

**Assertions:**
- App displays without crashing
- Sign-in/sign-up UI is visible
- If Clerk key missing: shows configuration hint

**Platform-specific:**
- Web: Landing page with "Sign In" CTA
- iOS: Welcome screen with setup hint (if no key)
- Android: Login screen or setup hint (if no key)

---

### FLOW-002: Sign Up (New User)

**Preconditions:** Signed out, valid Clerk keys configured

**Steps:**
1. Tap "Sign Up" or "Create Account"
2. Enter email address
3. Enter password (meeting requirements)
4. Complete verification (if required)
5. Complete onboarding (if any)

**Assertions:**
- User lands on main dashboard/challenges view
- User data is created in backend
- "New Challenge" button is visible

**Test Data:**
```yaml
email: "e2e-test-{timestamp}@test.tally-tracker.app"
password: "TestPassword123!"
```

---

### FLOW-003: Sign In (Existing User)

**Preconditions:** Signed out, user account exists

**Steps:**
1. Navigate to sign-in
2. Enter email address
3. Enter password
4. Submit

**Assertions:**
- User lands on dashboard
- Previous challenges are visible
- Previous entries are preserved
- User profile data matches

**Test Data:**
```yaml
email: "${TEST_USER_EMAIL}"
password: "${TEST_USER_PASSWORD}"
```

---

### FLOW-004: Sign Out

**Preconditions:** Signed in

**Steps:**
1. Open user menu/settings
2. Tap "Sign Out"
3. Confirm (if prompted)

**Assertions:**
- User returns to signed-out state
- Sign-in UI is visible
- No user data visible on screen

---

## Challenge Management Flows

### FLOW-010: Create New Challenge

**Preconditions:** Signed in

**Steps:**
1. Tap "New Challenge" button
2. Enter challenge name
3. Enter target value
4. Select timeframe (if applicable)
5. Tap "Create" / "Save"

**Assertions:**
- Dialog/form closes
- New challenge appears in list
- Challenge shows correct name and target
- Progress shows 0 / target

**Test Data:**
```yaml
name: "E2E Test Challenge {timestamp}"
target: 100
timeframe: "weekly"
```

---

### FLOW-011: Add Entry to Challenge

**Preconditions:** Signed in, at least one challenge exists

**Steps:**
1. Select/open a challenge
2. Tap "Add Entry" or use quick-add
3. Enter count value
4. Select date (default: today)
5. Submit

**Assertions:**
- Entry appears in entry list
- Challenge progress updates
- Total reflects new entry
- Entry shows correct date and value

**Test Data:**
```yaml
count: 5
date: "today"
```

---

### FLOW-012: Add Entry to Existing Challenge (Quick Add)

**Preconditions:** Signed in, challenge visible in list

**Steps:**
1. On challenge card, use quick-add input
2. Enter count value
3. Press Enter or tap add button

**Assertions:**
- Count updates immediately
- Progress bar reflects change
- Success feedback shown (toast/animation)

**Test Data:**
```yaml
count: 10
```

---

### FLOW-013: Edit Challenge

**Preconditions:** Signed in, challenge exists

**Steps:**
1. Open challenge detail
2. Tap "Edit" or settings icon
3. Modify name/target/settings
4. Save changes

**Assertions:**
- Changes persist after save
- List view reflects updates
- Progress recalculates if target changed

---

### FLOW-014: Archive/Delete Challenge

**Preconditions:** Signed in, challenge exists

**Steps:**
1. Open challenge settings
2. Tap "Archive" or "Delete"
3. Confirm action

**Assertions:**
- Challenge removed from active list
- (If archived) Challenge visible in archive view
- (If deleted) Challenge and entries permanently removed

---

## Progress & Analytics Flows

### FLOW-020: View Dashboard Trends

**Preconditions:** Signed in, challenge with multiple entries exists

**Steps:**
1. Navigate to dashboard/progress view
2. View trend chart/stats

**Assertions:**
- Chart displays with data points
- Data matches sum of entries
- Date range reflects entry dates
- Statistics (streak, average) are accurate

**Verification:**
```yaml
# After adding entries [5, 10, 15] on consecutive days:
expected_total: 30
expected_entries_count: 3
expected_average: 10
```

---

### FLOW-021: View Challenge Progress Detail

**Preconditions:** Signed in, challenge with entries exists

**Steps:**
1. Tap on challenge card
2. View detail screen

**Assertions:**
- All entries listed with dates and values
- Running total correct
- Progress percentage accurate
- Trend visualization (if available)

---

## Community Flows

### FLOW-030: View Community Challenge

**Preconditions:** Signed in, public challenges exist

**Steps:**
1. Navigate to Community/Discover tab
2. Browse available challenges
3. Tap on a public challenge

**Assertions:**
- Challenge details visible
- Creator info shown
- Participant count/leaderboard visible
- Option to join/follow available

---

### FLOW-031: Follow Public Challenge

**Preconditions:** Signed in, viewing public challenge

**Steps:**
1. Tap "Follow" or "Join" button
2. Confirm (if prompted)

**Assertions:**
- Challenge appears in user's followed list
- User can view but not edit challenge
- Leaderboard includes user (if participating)

---

## Data Management Flows

### FLOW-040: Export Data

**Preconditions:** Signed in, at least one challenge with entries

**Steps:**
1. Navigate to Settings/Data
2. Tap "Export Data"
3. Select format (JSON/CSV)
4. Confirm export

**Assertions:**
- File downloads/saves successfully
- File contains all user challenges
- File contains all entries with dates
- Format is valid and parseable

**Export Format (JSON):**
```json
{
  "version": "1.0",
  "exportedAt": "2026-01-13T10:00:00Z",
  "challenges": [
    {
      "name": "Challenge Name",
      "target": 100,
      "entries": [
        { "date": "2026-01-10", "count": 5 },
        { "date": "2026-01-11", "count": 10 }
      ]
    }
  ]
}
```

---

### FLOW-041: Import Data

**Preconditions:** Signed in, valid export file available

**Steps:**
1. Navigate to Settings/Data
2. Tap "Import Data"
3. Select file
4. Review import preview
5. Confirm import

**Assertions:**
- Challenges created from import
- Entries match import file
- No duplicate challenges (or handled appropriately)
- Import summary shown

---

## Data Persistence Flows

### FLOW-050: Login and Verify Data Persistence

**Preconditions:** User has existing data, currently signed out

**Steps:**
1. Sign in with existing account
2. Navigate to challenges list
3. Open a challenge with entries

**Assertions:**
- All previously created challenges visible
- Entry history preserved
- Progress/totals accurate
- Settings/preferences restored

---

## Test Implementation Matrix

| Flow ID | Web (Playwright) | iOS (XCUITest) | Android (Compose) |
|---------|------------------|----------------|-------------------|
| FLOW-001 | `smoke.spec.ts` | `TallyAppUITests` | `TallyAppInstrumentedTest` |
| FLOW-002 | `auth.spec.ts` | `AuthUITests` | `AuthInstrumentedTest` |
| FLOW-003 | `auth.spec.ts` | `AuthUITests` | `AuthInstrumentedTest` |
| FLOW-004 | `auth.spec.ts` | `AuthUITests` | `AuthInstrumentedTest` |
| FLOW-010 | `authenticated.spec.ts` | `ChallengeUITests` | `ChallengeInstrumentedTest` |
| FLOW-011 | `authenticated.spec.ts` | `EntryUITests` | `EntryInstrumentedTest` |
| FLOW-012 | `authenticated.spec.ts` | `EntryUITests` | `EntryInstrumentedTest` |
| FLOW-020 | `dashboard.spec.ts` | `DashboardUITests` | `DashboardInstrumentedTest` |
| FLOW-030 | `community.spec.ts` | `CommunityUITests` | `CommunityInstrumentedTest` |
| FLOW-040 | `data.spec.ts` | `DataUITests` | `DataInstrumentedTest` |
| FLOW-041 | `data.spec.ts` | `DataUITests` | `DataInstrumentedTest` |
| FLOW-050 | `auth.spec.ts` | `AuthUITests` | `AuthInstrumentedTest` |

---

## Test Data Requirements

### Dedicated Test Accounts

Each platform should use dedicated test accounts:

```yaml
# Environment variables
TEST_USER_EMAIL: "e2e-test@tally-tracker.app"
TEST_USER_PASSWORD: "${secure_password}"

# Pre-seeded data for FLOW-050 verification
test_user_challenges:
  - name: "Daily Steps"
    target: 10000
    entries:
      - { date: "2026-01-01", count: 8500 }
      - { date: "2026-01-02", count: 10200 }
      - { date: "2026-01-03", count: 9800 }
```

### Test Isolation

- Tests should clean up created data after completion
- Use unique identifiers (timestamps) for test-created entities
- Consider separate test database/environment for E2E tests

---

## Running Cross-Platform Tests

### Web
```bash
cd tally-web
TEST_USER_EMAIL=... TEST_USER_PASSWORD=... bun run test:e2e
```

### iOS
```bash
cd tally-ios
xcodebuild test -scheme Tally -destination 'platform=iOS Simulator,name=iPhone 15 Pro' \
  CLERK_PUBLISHABLE_KEY_DEV=pk_test_...
```

### Android
```bash
cd tally-android
CLERK_PUBLISHABLE_KEY_DEV=pk_test_... ./gradlew connectedAndroidTest
```

---

## References

- [Key Journeys](../key-journeys.md) - High-level journey descriptions
- [Testing Guide](./TESTING.md) - Platform-specific test setup
- [API Documentation](./api/) - Backend endpoints for test verification
