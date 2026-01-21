import { test, expect } from "./fixtures/test";

test.describe("Community Features @community @smoke", () => {
  test("dashboard section is accessible in offline mode", async ({ page }) => {
    await page.goto("/offline");
    
    // Should see some content
    await expect(page.locator("body")).toContainText(/challenge|offline/i);
  });
});
