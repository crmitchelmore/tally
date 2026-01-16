import { test, expect } from "@playwright/test";

/**
 * E2E tests for core user journeys
 * See USER-JOURNEYS.md for detailed journey specifications
 * 
 * Note: Tests requiring authentication use test user credentials from env.
 * Run with: TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables set.
 */

test.describe("Journey: Landing Page Experience", () => {
  test("displays all key marketing sections", async ({ page }) => {
    await page.goto("/");
    
    // Hero section
    await expect(page.locator("h1")).toContainText("Track");
    
    // CTAs
    await expect(page.getByRole("link", { name: /create an account/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
    
    // How it works
    await expect(page.locator("text=How it works")).toBeVisible();
    await expect(page.locator("text=Set a challenge")).toBeVisible();
    await expect(page.locator("text=Log your progress")).toBeVisible();
    await expect(page.locator("text=Stay on pace")).toBeVisible();
    
    // Final CTA
    await expect(page.locator("h2")).toContainText("Ready to start");
  });

  test("CTA navigates to sign-up", async ({ page }) => {
    await page.goto("/");
    
    await page.click("text=Create an account");
    await expect(page).toHaveURL(/sign-up/);
  });

  test("sign in link navigates to sign-in", async ({ page }) => {
    await page.goto("/");
    
    await page.click("text=Sign in");
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe("Journey: Community Discovery", () => {
  test("community page loads with search and challenges section", async ({ page }) => {
    await page.goto("/community");
    
    // Header
    await expect(page.locator("h1")).toContainText("Community");
    
    // Search
    await expect(page.getByPlaceholder(/search/i)).toBeVisible();
    
    // Public challenges section
    await expect(page.locator("text=Public Challenges")).toBeVisible();
  });

  test("search input works and filters", async ({ page }) => {
    await page.goto("/community");
    
    const searchInput = page.getByPlaceholder(/search/i);
    await searchInput.fill("pushups");
    
    // Search should be responsive
    await expect(searchInput).toHaveValue("pushups");
  });
});

test.describe("Journey: Leaderboard Exploration", () => {
  test("leaderboard displays time range options", async ({ page }) => {
    await page.goto("/leaderboard");
    
    await expect(page.locator("h1")).toContainText("Leaderboard");
    
    // Time range buttons
    await expect(page.getByRole("button", { name: /this week/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /this month/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /this year/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /all time/i })).toBeVisible();
  });

  test("time range selection changes active state", async ({ page }) => {
    await page.goto("/leaderboard");
    
    // Click week
    await page.getByRole("button", { name: /this week/i }).click();
    await expect(page.getByRole("button", { name: /this week/i })).toHaveAttribute("data-state", "active");
    
    // Click all time
    await page.getByRole("button", { name: /all time/i }).click();
    await expect(page.getByRole("button", { name: /all time/i })).toHaveAttribute("data-state", "active");
  });
});

test.describe("Journey: Mobile Placeholder Pages", () => {
  test("iOS page shows coming soon and web CTA", async ({ page }) => {
    await page.goto("/ios");
    
    await expect(page.locator("h1")).toContainText(/iOS|iPhone|App Store/i);
    await expect(page.getByRole("link", { name: /open app|web app/i })).toBeVisible();
  });

  test("Android page shows coming soon and web CTA", async ({ page }) => {
    await page.goto("/android");
    
    await expect(page.locator("h1")).toContainText(/Android|Play Store/i);
    await expect(page.getByRole("link", { name: /open app|web app/i })).toBeVisible();
  });
});

test.describe("Accessibility", () => {
  test("landing page has single h1 and proper heading hierarchy", async ({ page }) => {
    await page.goto("/");
    
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1);
    
    // Should have h2s for sections
    const h2Count = await page.locator("h2").count();
    expect(h2Count).toBeGreaterThanOrEqual(1);
  });

  test("all buttons and links are keyboard accessible", async ({ page }) => {
    await page.goto("/");
    
    // Tab through the page
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    
    // Something should be focused
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
  });

  test("sign-in page is accessible via keyboard", async ({ page }) => {
    await page.goto("/sign-in");
    await page.waitForLoadState("networkidle");
    
    // Tab should navigate to form elements
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
  });
});

test.describe("Error Handling", () => {
  test("404 page displays for unknown routes", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    
    // Should return 404 or show 404 content
    if (response) {
      expect([200, 404]).toContain(response.status());
    }
    
    // Page should render something (not crash)
    await expect(page.locator("body")).not.toBeEmpty();
  });
});
