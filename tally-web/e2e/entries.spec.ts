import { test, expect } from "./fixtures/test";

test.describe("Entry Logging @entries @smoke", () => {
  test("offline page is accessible", async ({ page }) => {
    await page.goto("/offline");
    
    // Page should load
    await expect(page.locator("body")).toBeVisible();
  });
});
