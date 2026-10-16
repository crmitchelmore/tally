import { test, expect } from "./fixtures/test";

test("header HDR accent retains its SDR and accessibility fallbacks @offline", async ({ page }) => {
  await page.goto("/");
  const title = page.locator(".landing-header .hdr-title-accent");
  await expect(title).toHaveText("tally");
  await expect(title).toHaveCSS("color", "rgb(27, 26, 23)");
  await expect(title).toHaveCSS("background-image", "none");
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await expect(title).toHaveCSS("color", "rgb(237, 236, 234)");
  // Headless SDR does not validate actual HDR emission. Force only the CSS gate
  // to exercise clipping/fallback plumbing, not pretend to emulate HDR hardware.
  await page.evaluate(() => {
    const style = document.createElement("style");
    style.textContent = Array.from(document.styleSheets).flatMap(sheet => {
      try { return Array.from(sheet.cssRules).map(rule => rule.cssText); }
      catch { return []; }
    }).filter(text => text.includes("dynamic-range: high"))
      .join("\n").split("(dynamic-range: high)").join("(min-width: 0px)");
    document.head.append(style);
  });
  await expect(title).toHaveCSS("background-image", /\/hdr\/white-1\.5x\.jpg/);
  await expect(title).toHaveCSS("background-color", "rgb(237, 236, 234)");
  await expect(title).toHaveCSS("background-clip", "text");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(title).toHaveCSS("animation-name", "none");
  await page.emulateMedia({ media: "print" });
  await expect(title).toHaveCSS("background-image", "none");
  await expect(title).toHaveCSS("-webkit-text-fill-color", "rgb(237, 236, 234)");
  await page.emulateMedia({ media: "screen", forcedColors: "active" });
  await expect(title).toHaveCSS("background-image", "none");
  expect(await title.evaluate(el => getComputedStyle(el).webkitTextFillColor)).not.toBe("rgba(0, 0, 0, 0)");
  await expect(page.locator(".landing-footer .hdr-title-accent")).toHaveCount(0);
});
