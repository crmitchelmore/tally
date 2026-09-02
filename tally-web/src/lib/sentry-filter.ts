type SentryEventLike = {
  exception?: {
    values?: Array<{
      type?: string;
      value?: string;
      stacktrace?: {
        frames?: Array<{ filename?: string }>;
      };
    }>;
  };
};

const CLERK_5_127_2_SCRIPT =
  /\/npm\/@clerk\/clerk-js@5\.127\.2\/dist\/clerk\.browser\.js(?:$|[?#])/;
const CHROME_116 = /\bChrome\/116(?:\.\d+){0,3}\b/;
const LINUX = /\bLinux\b/;

/**
 * Matches one known third-party parse error from an unsupported browser.
 * Keep this deliberately narrow so first-party and newer-browser syntax errors
 * continue to reach Sentry.
 */
export function isUnsupportedClerkChrome116SyntaxError(
  event: SentryEventLike,
  userAgent: string,
): boolean {
  if (!CHROME_116.test(userAgent) || !LINUX.test(userAgent)) return false;

  return (event.exception?.values ?? []).some(
    (exception) =>
      exception.type === "SyntaxError" &&
      exception.value === "Unexpected token '('" &&
      (exception.stacktrace?.frames ?? []).some((frame) =>
        CLERK_5_127_2_SCRIPT.test(frame.filename ?? ""),
      ),
  );
}
