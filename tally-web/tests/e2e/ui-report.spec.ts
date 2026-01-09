import { test, expect } from "@playwright/test";

test("@ui signed-out home snapshot", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Tally" })).toBeVisible();

  // Visual regression snapshot (non-blocking in CI via UI Report workflow).
  await expect(page).toHaveScreenshot("home.png", { fullPage: true });
});

test("@ui components page snapshot", async ({ page }) => {
  await page.goto("/test-components", { waitUntil: "networkidle" });
  await expect(
    page.getByRole("heading", { name: "Component Test Page" })
  ).toBeVisible();

  await expect(page).toHaveScreenshot("test-components.png", { fullPage: true });
});
