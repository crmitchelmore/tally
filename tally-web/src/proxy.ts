import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ensureClerkSecretKeyEnv } from "@/lib/clerk-server";

ensureClerkSecretKeyEnv();

const isPublicRoute = createRouteMatcher([
  "/",
  "/ios",
  "/android",
  "/app(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/test-components",
]);

// Security headers for all responses
const securityHeaders = {
  // Prevent clickjacking
  "X-Frame-Options": "DENY",
  // Prevent MIME type sniffing
  "X-Content-Type-Options": "nosniff",
  // Control referrer information
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Disable unnecessary browser features
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  // Enforce HTTPS
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  // XSS Protection (legacy browsers)
  "X-XSS-Protection": "1; mode=block",
};

// Content Security Policy
// Note: Clerk, Convex, and Sentry require specific domains
const cspDirectives = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'", // Required for Next.js
    "'unsafe-eval'", // Required for development; remove in production if possible
    "https://*.clerk.accounts.dev",
    "https://clerk.tally-tracker.app",
    "https://*.convex.cloud",
    "https://*.sentry.io",
  ],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:", "https://*.clerk.com", "https://img.clerk.com"],
  "font-src": ["'self'", "data:"],
  "connect-src": [
    "'self'",
    "https://*.clerk.accounts.dev",
    "https://clerk.tally-tracker.app",
    "https://*.convex.cloud",
    "https://*.convex.site",
    "wss://*.convex.cloud",
    "https://*.sentry.io",
    "https://*.launchdarkly.com",
  ],
  "frame-src": ["'self'", "https://*.clerk.accounts.dev"],
  "frame-ancestors": ["'none'"],
  "form-action": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
};

function buildCSP(): string {
  return Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(" ")}`)
    .join("; ");
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Add static security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add CSP header
  response.headers.set("Content-Security-Policy", buildCSP());

  return response;
}

export default clerkMiddleware(async (auth, req: NextRequest) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Get the response from the next handler
  const response = NextResponse.next();

  // Add security headers to all responses
  return addSecurityHeaders(response);
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
