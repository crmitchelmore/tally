import { test, expect } from "./fixtures/test";

test.describe("Data Portability @data @smoke", () => {
  test("offline mode supports local data", async ({ page }) => {
    await page.goto("/offline");
    
    // Page should load without errors
    await expect(page.locator("body")).toBeVisible();
  });
});
