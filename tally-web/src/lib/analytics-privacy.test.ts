import { describe, expect, it } from "vitest";
import { scrubAnalyticsURLs } from "./analytics-privacy";

describe("analytics URL privacy", () => {
  it("strips secrets from event and initial identity URLs", () => {
    const properties = {
      $current_url: "https://user:password@example.com/offline?token=secret#private",
      $set_once: { $initial_current_url: "https://example.com/?email=private@example.com", platform: "web" },
      $set: { $referrer: "https://example.com/sign-in?code=private" },
    };
    scrubAnalyticsURLs(properties);
    expect(properties).toEqual({
      $current_url: "https://example.com/offline",
      $set_once: { $initial_current_url: "https://example.com/", platform: "web" },
      $set: { $referrer: "https://example.com/sign-in" },
    });
  });
  it("drops malformed URL values without changing unrelated metadata", () => {
    const properties = { $referrer: "not a URL", platform: "web", $set_once: null };
    scrubAnalyticsURLs(properties);
    expect(properties).toEqual({ platform: "web", $set_once: null });
  });
});
