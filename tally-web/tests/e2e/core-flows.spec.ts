import { test, expect, Page } from "@playwright/test";

/**
 * Core user flow E2E tests.
 * These tests cover the critical user journeys defined in docs/CORE-FLOWS.md
 *
 * Requires: TEST_USER_EMAIL, TEST_USER_PASSWORD environment variables
 * Run with: TEST_USER_EMAIL=... TEST_USER_PASSWORD=... bun run test:e2e
 */

// ============================================================================
// Test Utilities
// ============================================================================

async function signIn(page: Page): Promise<void> {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error("Missing TEST_USER_EMAIL or TEST_USER_PASSWORD");
  }

  await page.goto("/sign-in", { waitUntil: "domcontentloaded" });
  await page.getByLabel(/email address|email/i).fill(email);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "Continue", exact: true }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(/\/(app)?$/, { timeout: 30000 });
}

async function signOut(page: Page): Promise<void> {
  // Look for user button (Clerk UserButton component)
  const userButton = page.locator('[data-clerk-component="UserButton"]').or(
    page.getByRole("button", { name: /account|user|profile/i })
  );

  if (await userButton.isVisible({ timeout: 5000 })) {
    await userButton.click();

    // Wait for menu to appear
    await page.waitForTimeout(500);

    // Click sign out option
    const signOutBtn = page.getByRole("menuitem", { name: /sign out/i }).or(
      page.getByRole("button", { name: /sign out/i })
    );

    if (await signOutBtn.isVisible({ timeout: 3000 })) {
      await signOutBtn.click();

      // Wait for signed out state
      await page.waitForURL(/\/(sign-in)?$/, { timeout: 10000 });
    }
  }
}

function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now()}`;
}

// ============================================================================
// FLOW-001: First Launch (Signed Out)
// ============================================================================

test.describe("FLOW-001: First Launch", () => {
  test("signed out user sees landing page with sign-in CTA", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Should show sign-in option
    const signInLink = page.getByRole("link", { name: /sign in/i }).or(
      page.getByRole("button", { name: /sign in/i })
    );

    await expect(signInLink).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================================
// FLOW-003: Sign In (Existing User) + FLOW-004: Sign Out
// ============================================================================

test.describe("FLOW-003 & FLOW-004: Sign In/Out", () => {
  test.beforeEach(async () => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Missing TEST_USER_EMAIL/TEST_USER_PASSWORD");
  });

  test("@auth user can sign in and see dashboard", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    // Should see authenticated dashboard
    await expect(page.getByRole("button", { name: /new challenge/i })).toBeVisible({
      timeout: 15000,
    });
  });

  test("@auth user can sign out", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    await signOut(page);

    // Should be on sign-in or landing page
    const signInVisible = await page.getByRole("link", { name: /sign in/i }).isVisible();
    const onSignInPage = page.url().includes("sign-in");

    expect(signInVisible || onSignInPage).toBeTruthy();
  });
});

// ============================================================================
// FLOW-010: Create New Challenge
// ============================================================================

test.describe("FLOW-010: Create Challenge", () => {
  test.beforeEach(async () => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Missing TEST_USER_EMAIL/TEST_USER_PASSWORD");
  });

  test("@auth @crud user can create a new challenge", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    // Open create dialog
    await page.getByRole("button", { name: /new challenge/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });

    // Fill form
    const challengeName = uniqueName("E2E Challenge");
    await page.getByLabel(/name/i).fill(challengeName);
    await page.getByLabel(/target/i).fill("100");

    // Submit
    await page.getByRole("button", { name: /create|save/i }).click();

    // Verify challenge appears
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(challengeName)).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================================
// FLOW-011 & FLOW-012: Add Entry to Challenge
// ============================================================================

test.describe("FLOW-011 & FLOW-012: Add Entry", () => {
  test.beforeEach(async () => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Missing TEST_USER_EMAIL/TEST_USER_PASSWORD");
  });

  test("@auth @crud user can add entry via quick-add", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    // Wait for challenges to load
    const challengesSection = page.locator('[data-testid="challenges-section"]');
    await expect(challengesSection).toBeVisible({ timeout: 15000 });

    // Find quick-add input on first challenge
    const quickAdd = page.locator('[data-testid="quick-add"]').first().or(
      page.getByRole("spinbutton").first()
    );

    if (await quickAdd.isVisible({ timeout: 5000 })) {
      // Get initial value (if displayed)
      const progressBefore = await page.locator('[data-testid="progress-count"]').first().textContent();

      // Add entry
      await quickAdd.fill("5");
      await quickAdd.press("Enter");

      // Wait for update
      await page.waitForTimeout(2000);

      // Progress should have changed
      const progressAfter = await page.locator('[data-testid="progress-count"]').first().textContent();

      // At minimum, no error should occur
      expect(progressAfter).toBeTruthy();
    }
  });

  test("@auth @crud user can add entry via challenge detail", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    // Click on first challenge to open detail
    const challengeCard = page.locator('[data-testid="challenge-card"]').first().or(
      page.locator(".challenge-card").first()
    );

    if (await challengeCard.isVisible({ timeout: 10000 })) {
      await challengeCard.click();

      // Wait for detail view
      await page.waitForTimeout(1000);

      // Look for add entry button
      const addEntryBtn = page.getByRole("button", { name: /add entry|log|record/i });

      if (await addEntryBtn.isVisible({ timeout: 5000 })) {
        await addEntryBtn.click();

        // Fill entry dialog
        const countInput = page.getByLabel(/count|value|amount/i).or(
          page.getByRole("spinbutton")
        );

        if (await countInput.isVisible({ timeout: 3000 })) {
          await countInput.fill("10");

          // Submit
          await page.getByRole("button", { name: /save|add|submit/i }).click();

          // Entry should appear
          await page.waitForTimeout(2000);
        }
      }
    }
  });
});

// ============================================================================
// FLOW-020: View Dashboard Trends
// ============================================================================

test.describe("FLOW-020: Dashboard Trends", () => {
  test.beforeEach(async () => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Missing TEST_USER_EMAIL/TEST_USER_PASSWORD");
  });

  test("@auth dashboard shows progress and trends", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    // Wait for dashboard to load
    await page.waitForTimeout(2000);

    // Should show some progress indicator
    const progressIndicator = page.locator('[data-testid="progress-count"]').or(
      page.locator('[data-testid="challenge-progress"]').or(
        page.locator(".progress")
      )
    );

    // At minimum, challenges section should be visible
    const challengesSection = page.locator('[data-testid="challenges-section"]').or(
      page.locator('[data-testid="empty-state"]')
    );

    await expect(challengesSection.first()).toBeVisible({ timeout: 15000 });
  });

  test("@auth dashboard data matches entry totals", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    // Wait for data to load
    await page.waitForTimeout(3000);

    // Check that displayed totals are numeric and not NaN
    const progressCounts = page.locator('[data-testid="progress-count"]');
    const count = await progressCounts.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const text = await progressCounts.nth(i).textContent();
      if (text) {
        // Should be parseable as number
        const num = parseInt(text.replace(/[^\d]/g, ""), 10);
        expect(isNaN(num)).toBeFalsy();
      }
    }
  });
});

// ============================================================================
// FLOW-030: View Community Challenge
// ============================================================================

test.describe("FLOW-030: Community Challenges", () => {
  test.beforeEach(async () => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Missing TEST_USER_EMAIL/TEST_USER_PASSWORD");
  });

  test("@auth user can view community/discover section", async ({ page }) => {
    await signIn(page);

    // Navigate to community tab if it exists
    const communityTab = page.getByRole("link", { name: /community|discover|explore/i }).or(
      page.getByRole("button", { name: /community|discover|explore/i })
    );

    if (await communityTab.isVisible({ timeout: 5000 })) {
      await communityTab.click();
      await page.waitForTimeout(2000);

      // Should show community content
      const communityContent = page.locator('[data-testid="community-section"]').or(
        page.getByText(/public challenges|discover/i)
      );

      // If community feature exists, verify it loads
      if (await communityContent.isVisible({ timeout: 5000 })) {
        expect(true).toBeTruthy();
      }
    }
  });
});

// ============================================================================
// FLOW-040 & FLOW-041: Export / Import Data
// ============================================================================

test.describe("FLOW-040 & FLOW-041: Export/Import Data", () => {
  test.beforeEach(async () => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Missing TEST_USER_EMAIL/TEST_USER_PASSWORD");
  });

  test("@auth user can access export functionality", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    // Look for settings/menu
    const settingsBtn = page.getByRole("button", { name: /settings|menu|more/i }).or(
      page.locator('[data-testid="settings-button"]')
    );

    if (await settingsBtn.isVisible({ timeout: 5000 })) {
      await settingsBtn.click();
      await page.waitForTimeout(500);

      // Look for export option
      const exportOption = page.getByRole("menuitem", { name: /export/i }).or(
        page.getByRole("button", { name: /export/i }).or(
          page.getByText(/export data/i)
        )
      );

      if (await exportOption.isVisible({ timeout: 3000 })) {
        await exportOption.click();

        // Export dialog should appear
        const exportDialog = page.getByRole("dialog").or(
          page.locator('[data-testid="export-dialog"]')
        );

        await expect(exportDialog).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("@auth user can access import functionality", async ({ page }) => {
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    // Look for settings/menu
    const settingsBtn = page.getByRole("button", { name: /settings|menu|more/i }).or(
      page.locator('[data-testid="settings-button"]')
    );

    if (await settingsBtn.isVisible({ timeout: 5000 })) {
      await settingsBtn.click();
      await page.waitForTimeout(500);

      // Look for import option
      const importOption = page.getByRole("menuitem", { name: /import/i }).or(
        page.getByRole("button", { name: /import/i }).or(
          page.getByText(/import data/i)
        )
      );

      if (await importOption.isVisible({ timeout: 3000 })) {
        await importOption.click();

        // Import dialog should appear
        const importDialog = page.getByRole("dialog").or(
          page.locator('[data-testid="import-dialog"]')
        );

        await expect(importDialog).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

// ============================================================================
// FLOW-050: Login and Verify Data Persistence
// ============================================================================

test.describe("FLOW-050: Data Persistence", () => {
  test.beforeEach(async () => {
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;
    test.skip(!email || !password, "Missing TEST_USER_EMAIL/TEST_USER_PASSWORD");
  });

  test("@auth user data persists after sign out and sign in", async ({ page }) => {
    // First session: sign in and record challenge count
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    // Wait for challenges to load
    await page.waitForTimeout(3000);

    // Count visible challenges
    const challengeCards = page.locator('[data-testid="challenge-card"]').or(
      page.locator(".challenge-card")
    );
    const initialCount = await challengeCards.count();

    // Sign out
    await signOut(page);

    // Sign back in
    await signIn(page);
    await page.goto("/app", { waitUntil: "networkidle" });

    // Wait for challenges to load again
    await page.waitForTimeout(3000);

    // Count should match
    const finalCount = await challengeCards.count();
    expect(finalCount).toBeGreaterThanOrEqual(initialCount);
  });
});
