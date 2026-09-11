import { describe, expect, it } from "vitest";
import { isUnsupportedClerkChrome116SyntaxError } from "./sentry-filter";

const chrome116Linux =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36";

const matchingEvent = {
  exception: {
    values: [
      {
        type: "SyntaxError",
        value: "Unexpected token '('",
        stacktrace: {
          frames: [
            {
              filename:
                "https://clerk.tally-tracker.app/npm/@clerk/clerk-js@5.127.2/dist/clerk.browser.js",
            },
          ],
        },
      },
    ],
  },
};

describe("isUnsupportedClerkChrome116SyntaxError", () => {
  it("matches the known Clerk 5.127.2 parse failure on Chrome 116 Linux", () => {
    expect(
      isUnsupportedClerkChrome116SyntaxError(matchingEvent, chrome116Linux),
    ).toBe(true);
  });

  it.each([
    ["newer Chrome", chrome116Linux.replace("Chrome/116", "Chrome/117"), matchingEvent],
    ["non-Linux", chrome116Linux.replace("Linux x86_64", "Windows NT 10.0"), matchingEvent],
    ["different Clerk version", chrome116Linux, JSON.parse(JSON.stringify(matchingEvent).replace("5.127.2", "5.127.3"))],
    ["first-party script", chrome116Linux, JSON.parse(JSON.stringify(matchingEvent).replace("https://clerk.tally-tracker.app/npm/@clerk/clerk-js@5.127.2/dist/clerk.browser.js", "https://tally-tracker.app/_next/static/app.js"))],
    ["different syntax error", chrome116Linux, JSON.parse(JSON.stringify(matchingEvent).replace("Unexpected token '('", "Unexpected token ')'"))],
  ])("does not match %s", (_case, userAgent, event) => {
    expect(isUnsupportedClerkChrome116SyntaxError(event, userAgent)).toBe(false);
  });
});
