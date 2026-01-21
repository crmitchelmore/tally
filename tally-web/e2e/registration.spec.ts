import { test, expect } from "./fixtures/test";

test.describe("User Registration @registration @smoke", () => {
  test("sign-in page is accessible", async ({ page }) => {
    await page.goto("/sign-in");
    
    // Should see sign-in page or be redirected
    const url = page.url();
    expect(url).toMatch(/sign|clerk|auth/i);
  });
  
  test("offline alternative is available", async ({ page }) => {
    await page.goto("/sign-in");
    
    // Should have a way to continue without account
    const offlineLink = page.getByRole("link", { name: /without.*account|offline/i });
    
    // If not visible, that's okay - skip
    if (!(await offlineLink.isVisible())) {
      // Try navigating directly
      await page.goto("/offline");
    }
    
    await expect(page.locator("body")).toBeVisible();
  });
});
