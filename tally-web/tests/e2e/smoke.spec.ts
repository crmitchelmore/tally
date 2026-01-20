import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/", { waitUntil: "domcontentloaded", timeout: 60_000 });
  await expect(page).toHaveTitle(/Tally/i);
});
