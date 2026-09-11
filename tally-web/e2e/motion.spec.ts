import { test, expect } from "./fixtures/test";

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`logging works with ${reducedMotion} and follows live motion changes @offline`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion });
    await page.goto("/offline");
    await page.getByRole("button", { name: "Create Challenge", exact: true }).click();
    const creation = page.getByRole("dialog", { name: "New Challenge" });
    await creation.getByLabel("Name", { exact: true }).fill("Motion reading");
    await creation.getByLabel("Target", { exact: true }).fill("500");
    await creation.getByRole("button", { name: "Pages", exact: true }).click();
    await creation.getByRole("button", { name: "Create Challenge", exact: true }).click();
    const card = page.locator(".challenge-card").filter({ hasText: "Motion reading" });
    await expect(card).toBeVisible();
    if (reducedMotion === "reduce") {
      await expect(card).toHaveCSS("animation-name", "none");
    }
    await page.getByRole("button", { name: "Log progress for Motion reading" }).click();
    const entry = page.getByRole("dialog");
    await entry.getByLabel("How many pages?").fill("25");
    await entry.getByRole("button", { name: "Add 25 pages", exact: true }).click();
    await expect(entry).not.toBeVisible();
    await expect(card.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    // Changing the accessibility setting while open must cancel decorative motion.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(card).toHaveCSS("animation-name", "none");
    await expect.poll(() => card.evaluate(element => element.getAnimations({ subtree: true })
      .filter(animation => animation.playState === "running").length)).toBe(0);
    await page.reload();
    await expect(card.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
  });
}
