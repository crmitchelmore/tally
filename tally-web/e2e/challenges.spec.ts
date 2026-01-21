import { test, expect } from "./fixtures/test";

test.describe("Challenge Management @challenges @smoke", () => {
  test.describe("Offline Challenge Creation", () => {
    test("can access create challenge in offline mode", async ({ page }) => {
      await page.goto("/offline");

      // Should see create button
      const createButton = page.getByRole("button", { name: /create|new|add/i });
      await expect(createButton).toBeVisible();
    });

    test("creating a challenge in offline mode", async ({ page }) => {
      await page.goto("/offline");

      // Click create
      const createButton = page.getByRole("button", { name: /create|new|add/i });
      await createButton.click();

      // Should see form or dialog
      await expect(page.locator("input, dialog, [role=dialog], form")).toBeVisible();
    });
  });
});
