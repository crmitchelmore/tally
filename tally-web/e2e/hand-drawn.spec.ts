import { test, expect } from "./fixtures/test";

test("hand-drawn ink varies without jumping on count or motion changes @offline", async ({ page }) => {
  await page.goto("/");
  const add = page.getByRole("button", { name: "Add one tally mark" });
  const paths = page.locator(".demo-gate path");
  await add.click();
  const first = await paths.first().getAttribute("d");
  for (let i = 1; i < 5; i++) await add.click();
  await expect(paths).toHaveCount(5);
  expect(await paths.first().getAttribute("d")).toBe(first);
  const drawings = await paths.evaluateAll(elements => elements.map(p => p.getAttribute("d")));
  expect(new Set(drawings).size).toBe(5);
  expect(drawings.every(d => d?.includes(" Q "))).toBe(true);
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await paths.first().getAttribute("d")).toBe(first);
  for (let i = 5; i < 25; i++) await add.click();
  await expect(paths).toHaveCount(25);
  expect(await paths.first().getAttribute("d")).toBe(first);
  await expect(page.getByText("25 little marks. Look how far you came.")).toBeVisible();
  await page.getByRole("button", { name: "Reset demo" }).click();
  await add.click();
  expect(await paths.first().getAttribute("d")).not.toBe(first);
});


test("sync demo uses accurate hand-drawn totals beyond fifteen @offline", async ({ page }) => {
  await page.goto("/");
  const demo = page.getByRole("region", { name: "Live sync demonstration" });
  const add = page.getByRole("button", { name: "Add a mark to demonstrate sync" });
  for (let count = 13; count <= 16; count++) {
    await add.click();
    await expect(demo.locator(".tally-display")).toHaveAttribute("aria-label", `${count} tallies`);
    await expect(add).toBeEnabled();
  }
  await expect(demo.locator(".tally-display path")).toHaveCount(16);
});
