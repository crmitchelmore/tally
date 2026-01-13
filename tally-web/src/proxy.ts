import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent } from "next/server";
import type { NextRequest } from "next/server";
import { ensureClerkSecretKeyEnv, ensureClerkPublishableKeyEnv } from "@/lib/clerk-server";

// Ensure Clerk keys are set from _DEV/_PROD variants before middleware initializes
ensureClerkPublishableKeyEnv();
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

// Match /__clerk/* proxy routes
const isClerkProxyRoute = createRouteMatcher(["/__clerk(.*)"]);

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

/**
 * Handle Clerk proxy requests.
 * This proxies /__clerk/* to frontend-api.clerk.dev to bypass Cloudflare for SaaS conflict.
 * The clerk.tally-tracker.app CNAME triggers Cloudflare Error 1000 because both our DNS
 * and Clerk's infrastructure use Cloudflare.
 */
async function handleClerkProxy(req: NextRequest): Promise<NextResponse> {
  const url = req.nextUrl.clone();
  const clerkPath = url.pathname.replace(/^\/__clerk/, "");
  
  // Build the Clerk API URL
  const clerkUrl = new URL(clerkPath || "/", "https://frontend-api.clerk.dev");
  clerkUrl.search = url.search;
  
  // Clone headers and add required Clerk proxy headers
  const headers = new Headers(req.headers);
  
  // The proxy URL that Clerk should use for callbacks
  const proxyUrl = `${url.protocol}//${url.host}/__clerk`;
  headers.set("Clerk-Proxy-Url", proxyUrl);
  
  // Add the secret key for authentication
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (secretKey) {
    headers.set("Clerk-Secret-Key", secretKey);
  }
  
  // Forward the client IP - append to existing chain if present
  const existingForwardedFor = req.headers.get("x-forwarded-for");
  const clientIp = req.headers.get("x-real-ip") || "unknown";
  const forwardedFor = existingForwardedFor 
    ? `${existingForwardedFor}, ${clientIp}` 
    : clientIp;
  headers.set("X-Forwarded-For", forwardedFor);
  
  // Remove host header to avoid conflicts
  headers.delete("host");
  
  try {
    const response = await fetch(clerkUrl.toString(), {
      method: req.method,
      headers,
      body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
      // @ts-expect-error - duplex is required for streaming body but not in types
      duplex: "half",
    });
    
    // Create response with Clerk's response
    const responseHeaders = new Headers(response.headers);
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Clerk proxy error:", error);
    return new NextResponse("Proxy error", { status: 502 });
  }
}

// Create the Clerk middleware handler
const clerkMiddlewareHandler = clerkMiddleware(async (auth, req: NextRequest) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Get the response from the next handler
  const response = NextResponse.next();

  // Add security headers to all responses
  return addSecurityHeaders(response);
});

// Main middleware function - handle Clerk proxy before clerkMiddleware
export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  // Handle Clerk proxy requests first (before clerkMiddleware)
  if (isClerkProxyRoute(req)) {
    return handleClerkProxy(req);
  }
  
  // For all other routes, use clerkMiddleware
  return clerkMiddlewareHandler(req, event);
}
