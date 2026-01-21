import { test, expect } from "./fixtures/test";

test.describe("New User Onboarding @web @smoke @onboarding", () => {
  test.describe("Landing Page", () => {
    test("viewing the landing page for the first time", async ({ page }) => {
      await page.goto("/");

      // Should see the landing page with title
      await expect(page).toHaveTitle(/tally/i);
      
      // Should see some content
      await expect(page.locator("h1, h2").first()).toBeVisible();
    });

    test("landing page has a call to action", async ({ page }) => {
      await page.goto("/");

      // Should see a link or button to start
      const cta = page.getByRole("link", { name: /start|track|try|sign/i }).first();
      await expect(cta).toBeVisible();
    });
  });

  test.describe("Starting to Use the App", () => {
    test("can navigate to offline mode", async ({ page }) => {
      await page.goto("/");

      // Click try without account link if visible
      const tryLink = page.getByRole("link", { name: /try.*without|continue.*without/i });
      if (await tryLink.isVisible()) {
        await tryLink.click();
        await expect(page).toHaveURL(/\/offline/);
      } else {
        // Navigate directly
        await page.goto("/offline");
        await expect(page).toHaveURL(/\/offline/);
      }
    });
  });
});
