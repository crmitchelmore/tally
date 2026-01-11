# Tally Testing Guide

This document describes the testing strategy, test pyramid, and setup for each platform.

## Test Pyramid & Boundaries

Our testing strategy follows the test pyramid principle: many fast unit tests at the base, fewer integration tests in the middle, and minimal E2E tests at the top.

```
        /\
       /  \      E2E (3-7 golden flows)
      /----\     - Critical user journeys only
     /      \    - Slow, expensive, can be flaky
    /--------\   
   /          \  Integration (moderate)
  /   ------   \ - Convex functions + auth
 /   |      |   \- API contract tests
/    |------|    \
------------------
     Unit          - Pure logic, deterministic
     (many)        - Fast, no network/DB
                   - Components in isolation
```

### Test Responsibilities

| Layer | What to Test | What NOT to Test |
|-------|-------------|------------------|
| **Unit** | Pure functions, data transforms, utils, component logic | Network calls, database, auth flows |
| **Integration** | Convex mutations, authz rules, API handlers | Full user journeys, UI rendering |
| **E2E** | Critical paths: signup, create challenge, log entry | Edge cases, error states, visual styling |

### Golden E2E Flows

Keep E2E tests to 3-7 critical user journeys:

1. ✅ **Anonymous landing** - Homepage loads, CTA visible
2. ✅ **Sign up flow** - New user can register
3. ✅ **Sign in flow** - Existing user can authenticate  
4. ✅ **Create challenge** - User creates first challenge
5. ✅ **Log entry** - User logs an entry
6. ✅ **View progress** - User sees their stats
7. ⬜ **Share challenge** - User shares (future)

Everything else should be tested at unit/integration level.

### Test File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Unit | `*.test.ts` | `stats.test.ts` |
| Integration | `*.integration.test.ts` | `challenges.integration.test.ts` |
| E2E | `*.spec.ts` | `auth.spec.ts` |

---

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

---

## Convex Integration Tests

Integration tests for Convex functions verify authorization and data integrity.

### Location

`tally-web/convex/*.integration.test.ts`

### What to Test

1. **Authorization checks**
   - User can only access own challenges
   - Public challenges accessible to all
   - Ownership verified on mutations

2. **Data invariants**
   - Entry dates validated
   - Challenge constraints enforced
   - Cascade deletes work

### Example Pattern

```typescript
// challenges.integration.test.ts
import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "./schema";
import { api } from "./_generated/api";

describe("challenges authorization", () => {
  it("user cannot update another user's challenge", async () => {
    const t = convexTest(schema);
    
    // Setup: create two users and a challenge
    const user1 = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { clerkId: "user1", ... });
    });
    const user2 = await t.run(async (ctx) => {
      return await ctx.db.insert("users", { clerkId: "user2", ... });
    });
    const challenge = await t.run(async (ctx) => {
      return await ctx.db.insert("challenges", { userId: user1, ... });
    });
    
    // Act: user2 tries to update user1's challenge
    // Assert: should throw UnauthorizedError
    await expect(
      t.mutation(api.challenges.update, { id: challenge, ... })
        .withIdentity({ subject: "user2" })
    ).rejects.toThrow("UnauthorizedError");
  });
});
```

### Running Integration Tests

```bash
cd tally-web
bun run test:integration  # If script exists, or:
bun run test -- --grep integration
```

### Key Auth Scenarios to Cover

| Scenario | Expected Result |
|----------|-----------------|
| Owner updates own challenge | ✅ Allowed |
| Non-owner updates challenge | ❌ UnauthorizedError |
| Owner deletes own entry | ✅ Allowed |
| Non-owner deletes entry | ❌ UnauthorizedError |
| Anonymous views public challenge | ✅ Allowed |
| Anonymous views private challenge | ❌ Denied |
| Follower views followed challenge | ✅ Allowed |

---

## E2E Stability Tips

### Reducing Flakiness

1. **Use resilient locators**
   ```typescript
   // ❌ Fragile
   page.locator('.btn-primary')
   
   // ✅ Resilient
   page.getByRole('button', { name: 'Create Challenge' })
   page.getByTestId('submit-button')
   ```

2. **Wait for network idle**
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

3. **Avoid timing-based waits**
   ```typescript
   // ❌ Arbitrary delays
   await page.waitForTimeout(2000);
   
   // ✅ Wait for condition
   await expect(page.getByText('Challenge created')).toBeVisible();
   ```

4. **Handle Clerk auth carefully**
   - Use dedicated test user
   - Store auth state to avoid re-login
   - Skip if secrets missing

### CI Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  retries: process.env.CI ? 2 : 0,  // Retry flaky tests in CI
  workers: process.env.CI ? 4 : undefined,
  timeout: 30000,
  expect: { timeout: 5000 },
});
```
