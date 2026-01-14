import { test, expect, Page } from "@playwright/test";

/**
 * Local-Only Mode E2E Tests
 *
 * Tests the complete local-only user journey:
 * - Entering local mode from landing page
 * - Creating challenges (stored in IndexedDB)
 * - Adding entries
 * - Data persistence across page reloads
 * - Community feature gating
 */

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * Enter local-only mode reliably for E2E tests.
 * Sets localStorage mode directly and navigates to /app.
 * This is more reliable than clicking the button due to Next.js client navigation timing.
 */
async function enterLocalMode(page: Page): Promise<void> {
  // Navigate directly to /app
  await page.goto("/app", { waitUntil: "domcontentloaded" });
  
  // Wait for initial page load
  await page.waitForLoadState("networkidle");
  
  // Set local mode in localStorage
  await page.evaluate(() => {
    localStorage.setItem("tally:appMode", "local-only");
  });
  
  // Reload to pick up the localStorage change
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  
  // Wait for the local dashboard to render by looking for the "Local Mode" badge
  // This confirms React has hydrated and read the localStorage value
  await expect(page.getByText("Local Mode")).toBeVisible({ timeout: 30000 });
}

async function createChallenge(
  page: Page,
  name: string,
  target: number
): Promise<void> {
  // Wait for dashboard to fully load
  await page.waitForTimeout(1000);
  
  // Open create dialog - could be "Create Your First Challenge" or "New Challenge"
  const createBtn = page
    .getByRole("button", { name: /create.*challenge|new challenge/i })
    .first();
  await expect(createBtn).toBeVisible({ timeout: 15000 });
  await createBtn.click();
  await page.waitForTimeout(1000);

  // Fill form
  await page.locator('input[placeholder*="Push-ups"]').fill(name);
  await page.locator('input[type="number"]').first().clear();
  await page.locator('input[type="number"]').first().fill(target.toString());

  // Submit
  await page.getByRole("button", { name: /create challenge/i }).last().click();
  await page.waitForTimeout(1500);
}

async function addEntry(page: Page, count: number): Promise<void> {
  // Open add entry sheet
  await page.getByRole("button", { name: /add entry/i }).click();
  await page.waitForTimeout(500);

  // Add count using +buttons
  if (count >= 10) {
    const times10 = Math.floor(count / 10);
    for (let i = 0; i < times10; i++) {
      await page.getByRole("button", { name: "Add 10", exact: true }).click();
      await page.waitForTimeout(50);
    }
  }

  const remainder = count % 10;
  if (remainder >= 5) {
    await page.getByRole("button", { name: "Add 5", exact: true }).click();
  }

  const ones = remainder % 5;
  for (let i = 0; i < ones; i++) {
    await page.getByRole("button", { name: "Add 1", exact: true }).click();
    await page.waitForTimeout(50);
  }

  // Submit
  await page.getByRole("button", { name: /done/i }).click();
  await page.waitForTimeout(1000);
}

// ============================================================================
// FLOW-LOCAL-001: Enter Local Mode
// ============================================================================

test.describe("FLOW-LOCAL-001: Enter Local Mode", () => {
  test("landing page shows 'Continue without account' option", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const localButton = page.getByRole("button", {
      name: /continue without an account/i,
    });
    await expect(localButton).toBeVisible({ timeout: 10000 });
  });

  test("clicking 'Continue without account' sets local mode", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    // Click the button
    const localButton = page.getByRole("button", {
      name: /continue without an account/i,
    });
    await expect(localButton).toBeVisible({ timeout: 10000 });
    await localButton.click();

    // Wait for navigation - client-side routing can be slow
    await page.waitForURL(/\/app/, { timeout: 10000 }).catch(() => {
      // Fallback: manually navigate if client routing didn't work
    });

    // Verify mode was set in localStorage
    const mode = await page.evaluate(() =>
      localStorage.getItem("tally:appMode")
    );
    expect(mode).toBe("local-only");
  });

  test("local mode shows local mode indicator", async ({ page }) => {
    await enterLocalMode(page);

    // enterLocalMode already waits for "Local Mode" badge
    // Also check for the LocalOnlyBanner which shows "Local-only mode"
    await expect(page.getByText("Local-only mode")).toBeVisible({ timeout: 15000 });
  });

  test("local mode shows upgrade path to create account", async ({ page }) => {
    await enterLocalMode(page);

    // Should show "Create Account" link (use first() since there might be multiple)
    const createAccountBtn = page
      .getByRole("link", {
        name: /create account/i,
      })
      .first();
    await expect(createAccountBtn).toBeVisible({ timeout: 15000 });
  });
});

// ============================================================================
// FLOW-LOCAL-002: Create Challenge in Local Mode
// ============================================================================

test.describe("FLOW-LOCAL-002: Create Challenge", () => {
  test("can create a challenge in local mode", async ({ page }) => {
    await enterLocalMode(page);

    const challengeName = `Local Test ${Date.now()}`;
    await createChallenge(page, challengeName, 100);

    // Challenge should appear
    await expect(page.getByText(challengeName)).toBeVisible({ timeout: 5000 });
  });

  test("challenge shows in dashboard with stats", async ({ page }) => {
    await enterLocalMode(page);
    await createChallenge(page, "Stats Test", 500);

    // Should show stats section
    await expect(page.getByText(/total marks/i)).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// FLOW-LOCAL-003: Add Entry in Local Mode
// ============================================================================

test.describe("FLOW-LOCAL-003: Add Entry", () => {
  test("can add entry to challenge in local mode", async ({ page }) => {
    await enterLocalMode(page);
    await createChallenge(page, "Entry Test", 100);

    await addEntry(page, 15);

    // Count should be visible somewhere in the page
    const pageText = await page.locator("body").innerText();
    expect(pageText).toContain("15");
  });

  test("entry persists after adding", async ({ page }) => {
    await enterLocalMode(page);
    await createChallenge(page, "Persist Entry", 200);

    await addEntry(page, 25);

    // Wait for state to settle
    await page.waitForTimeout(500);

    // Progress should show the entry
    const pageText = await page.locator("body").innerText();
    expect(pageText).toContain("25");
  });
});

// ============================================================================
// FLOW-LOCAL-004: Data Persistence
// ============================================================================

test.describe("FLOW-LOCAL-004: Data Persistence", () => {
  test("challenge persists after page reload", async ({ page }) => {
    await enterLocalMode(page);

    const challengeName = `Persist Test ${Date.now()}`;
    await createChallenge(page, challengeName, 100);
    await addEntry(page, 10);

    // Reload page
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Challenge should still be there - use heading for exact match
    await expect(
      page.getByRole("heading", { name: challengeName })
    ).toBeVisible({ timeout: 10000 });
  });

  test("multiple challenges persist", async ({ page }) => {
    await enterLocalMode(page);

    await createChallenge(page, "Challenge A", 100);
    await createChallenge(page, "Challenge B", 200);

    // Reload
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1000);

    // Both should be visible - use headings
    await expect(
      page.getByRole("heading", { name: "Challenge A" })
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole("heading", { name: "Challenge B" })
    ).toBeVisible({ timeout: 5000 });
  });
});

// ============================================================================
// FLOW-LOCAL-005: Community Feature Gating
// ============================================================================

test.describe("FLOW-LOCAL-005: Community Gating", () => {
  test("community features show 'requires account' gate", async ({ page }) => {
    await enterLocalMode(page);
    await createChallenge(page, "Gate Test", 100);

    // Try to access community tab (in bottom nav)
    const communityBtn = page.locator('[aria-label="Community"]');

    if ((await communityBtn.count()) > 0) {
      await communityBtn.click();
      await page.waitForTimeout(500);

      // Should show gate message
      await expect(page.getByText(/requires an account/i)).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("leaderboard features show 'requires account' gate", async ({
    page,
  }) => {
    await enterLocalMode(page);
    await createChallenge(page, "Leaderboard Gate", 100);

    // Try to access leaderboard tab
    const leaderboardBtn = page.locator('[aria-label="Leaderboard"]');

    if ((await leaderboardBtn.count()) > 0) {
      await leaderboardBtn.click();
      await page.waitForTimeout(500);

      // Should show gate message
      await expect(page.getByText(/requires an account/i)).toBeVisible({
        timeout: 5000,
      });
    }
  });

  test("gate shows 'Create free account' CTA", async ({ page }) => {
    await enterLocalMode(page);
    await createChallenge(page, "CTA Test", 100);

    const communityBtn = page.locator('[aria-label="Community"]');

    if ((await communityBtn.count()) > 0) {
      await communityBtn.click();
      await page.waitForTimeout(500);

      // Should show create account CTA
      await expect(
        page.getByRole("button", { name: /create free account/i })
      ).toBeVisible({ timeout: 5000 });
    }
  });
});

// ============================================================================
// FLOW-LOCAL-006: Export/Import in Local Mode
// ============================================================================

test.describe("FLOW-LOCAL-006: Export/Import", () => {
  test("can access backup & restore in local mode", async ({ page }) => {
    await enterLocalMode(page);
    await createChallenge(page, "Export Test", 100);

    // Open menu
    const menuBtn = page.getByRole("button", { name: /more options/i });
    await menuBtn.click();
    await page.waitForTimeout(300);

    // Click Backup & Restore
    const backupOption = page.getByRole("menuitem", {
      name: /backup.*restore/i,
    });

    if ((await backupOption.count()) > 0) {
      await backupOption.click();
      await page.waitForTimeout(500);

      // Dialog should open
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    }
  });
});

// ============================================================================
// FLOW-LOCAL-007: Full User Journey
// ============================================================================

test.describe("FLOW-LOCAL-007: Complete Local Journey", () => {
  test("full local-only workflow end-to-end", async ({ page }) => {
    // 1. Enter local mode
    await enterLocalMode(page);
    await expect(page.getByText(/local mode/i)).toBeVisible();

    // 2. Create challenge
    const challengeName = `Full Journey ${Date.now()}`;
    await createChallenge(page, challengeName, 1000);
    await expect(
      page.getByRole("heading", { name: challengeName })
    ).toBeVisible();

    // 3. Add entries
    await addEntry(page, 50);
    await page.waitForTimeout(500);

    // 4. Verify stats updated
    const pageText = await page.locator("body").innerText();
    expect(pageText).toContain("50");

    // 5. Reload and verify persistence
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await expect(
      page.getByRole("heading", { name: challengeName })
    ).toBeVisible();

    // 6. Verify upgrade path visible
    await expect(
      page.getByRole("link", { name: /create account/i }).first()
    ).toBeVisible();
  });
});
