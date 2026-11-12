import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safe-redirect";

describe("safeRedirectPath", () => {
  it("keeps same-origin relative paths", () => {
    expect(safeRedirectPath("/app/settings?tab=keys", "/app")).toBe("/app/settings?tab=keys");
  });
  it.each([null, "", "app", "https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "/\t/evil.example"])(
    "falls back for %j",
    (value) => {
      expect(safeRedirectPath(value, "/app")).toBe("/app");
    },
  );
});
