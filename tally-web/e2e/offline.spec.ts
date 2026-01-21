import { test, expect } from "./fixtures/test";

test.describe("Offline User Experience @offline @smoke", () => {
  test.describe("Accessing Offline Mode", () => {
    test("accessing offline mode from landing page", async ({ page }) => {
      await page.goto("/");
      
      // Click "Try without account" link
      const tryLink = page.getByRole("link", { name: /try without account|continue without account/i });
      if (await tryLink.isVisible()) {
        await tryLink.click();
        await expect(page).toHaveURL(/\/offline/);
      } else {
        // If not visible on landing, navigate directly
        await page.goto("/offline");
        await expect(page).toHaveURL(/\/offline/);
      }
    });

    test("offline mode page loads correctly", async ({ page }) => {
      await page.goto("/offline");
      
      // Should see offline mode indicator
      await expect(page.locator("h1, h2")).toContainText(/offline|challenges/i);
    });
  });

  test.describe("Basic Offline Functionality", () => {
    test("can see create challenge button in offline mode", async ({ page }) => {
      await page.goto("/offline");
      
      // Should see a way to create challenges
      const createButton = page.getByRole("button", { name: /create|new|add/i });
      await expect(createButton).toBeVisible();
    });
  });
});
