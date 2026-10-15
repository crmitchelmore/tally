import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("./hdr-title.css", import.meta.url), "utf8");
const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("HDR title progressive enhancement", () => {
  it("only opts the header's existing word into the accent", () => {
    expect(page.match(/className="hdr-title-accent"/g)).toHaveLength(1);
    expect(page).toContain('<span className="hdr-title-accent">tally</span>');
    expect(css).toContain(".dark .landing-header .hdr-title-accent");
    expect(css).not.toMatch(/filter:|text-shadow:|animation:|transition:/);
  });

  it("gates the enhancement and preserves readable ink and selection", () => {
    expect(css).toContain("@supports ((background-clip: text) or (-webkit-background-clip: text))");
    expect(css).toContain("@media screen and (dynamic-range: high) and (forced-colors: none)");
    expect(css).toContain("background-color: var(--color-ink)");
    expect(css).toContain("@media print, (forced-colors: active)");
    expect(css).toContain("-webkit-text-fill-color: currentColor");
    expect(css).toContain("-webkit-text-fill-color: HighlightText");
  });

  it("ships the verified gainmap bytes without image optimisation", () => {
    const image = readFileSync(new URL("../../public/hdr/white-1.5x.jpg", import.meta.url));
    expect(createHash("sha256").update(image).digest("hex"))
      .toBe("511edb2c416eb20f902d7b6c5015063ee1169ea9b34c085e02b07a9cc5406d32");
    expect(image.includes(Buffer.from("urn:iso:std:iso:ts:21496:-1"))).toBe(true);
    expect(css).toContain('url("/hdr/white-1.5x.jpg")');
  });
});
