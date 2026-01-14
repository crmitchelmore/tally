import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent } from "next/server";
import type { NextRequest } from "next/server";
import { ensureClerkSecretKeyEnv, ensureClerkPublishableKeyEnv, getClerkSecretKey } from "@/lib/clerk-server";

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
  // Static assets - middleware matcher should exclude these but adding as fallback
  "/_next/static(.*)",
  "/_next/image(.*)",
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
    "https://*.clerk.dev",
    "https://clerk.tally-tracker.app",
    "https://cdn.jsdelivr.net", // Clerk JS CDN fallback
    "https://challenges.cloudflare.com",
    "https://app.posthog.com",
    "https://app.launchdarkly.com",
    "https://*.convex.cloud",
    "https://*.sentry.io",
  ],
  "style-src": ["'self'", "'unsafe-inline'"],
  "img-src": ["'self'", "data:", "blob:", "https://*.clerk.com", "https://*.clerk.dev", "https://img.clerk.com", "https://images.clerk.dev"],
  "font-src": ["'self'", "data:"],
  "connect-src": [
    "'self'",
    "https://*.clerk.accounts.dev",
    "https://*.clerk.dev",
    "https://*.clerk.com",
    "https://clerk.tally-tracker.app",
    "https://*.convex.cloud",
    "https://*.convex.site",
    "wss://*.convex.cloud",
    "https://*.sentry.io",
    "https://app.posthog.com",
    "https://*.launchdarkly.com",
    "https://otlp-gateway-prod-gb-south-1.grafana.net",
  ],
  "frame-src": ["'self'", "https://*.clerk.accounts.dev", "https://*.clerk.dev", "https://challenges.cloudflare.com"],
  "frame-ancestors": ["'none'"],
  "form-action": ["'self'"],
  "base-uri": ["'self'"],
  "object-src": ["'none'"],
  "worker-src": ["'self'", "blob:"],
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
  
  // Add the secret key for authentication - use getClerkSecretKey() to get
  // the correct environment-specific key (CLERK_SECRET_KEY_PROD in production)
  const secretKey = getClerkSecretKey();
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
    
    const contentType = response.headers.get("content-type") || "";

    // Read the response body as ArrayBuffer to avoid encoding issues
    let body = await response.arrayBuffer();

    // Clerk can return HTML/JS that hardcodes accounts.<domain> even when we want to stay on the app.
    // As a last line of defense, rewrite those occurrences inside text responses.
    if (/^text\/(html|javascript)/i.test(contentType) || /^application\/(javascript|json)/i.test(contentType)) {
      const decoded = new TextDecoder().decode(body);
      const origin = `${url.protocol}//${url.host}`;
      const rewritten = decoded
        .replaceAll("https://accounts.tally-tracker.app", origin)
        .replaceAll("https://clerk.tally-tracker.app", `${origin}/__clerk`);
      if (rewritten !== decoded) {
        body = new TextEncoder().encode(rewritten).buffer;
      }
    }
    
    // Create response headers, removing problematic encoding headers
    // and rewriting cookie domains for the proxy
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      
      // Skip content-encoding since we've already decoded the body
      // and transfer-encoding since we're not streaming
      if (lowerKey === "content-encoding" || lowerKey === "transfer-encoding") {
        return;
      }
      
      // Rewrite Location headers so redirects stay within the /__clerk proxy (and never jump to accounts.*).
      if (lowerKey === "location") {
        let location = value;
        const origin = `${url.protocol}//${url.host}`;
        if (location.startsWith("https://frontend-api.clerk.dev")) {
          location = `${origin}/__clerk${location.replace("https://frontend-api.clerk.dev", "")}`;
        } else if (location.startsWith("/v1")) {
          location = `/__clerk${location}`;
        } else if (location.startsWith("https://accounts.tally-tracker.app") || location.startsWith("https://clerk.tally-tracker.app")) {
          location = `${origin}${new URL(location).pathname}${new URL(location).search}${new URL(location).hash}`;
        }
        responseHeaders.set(key, location);
        return;
      }

      // Rewrite Set-Cookie headers to use our domain instead of Clerk's
      if (lowerKey === "set-cookie") {
        // Replace Clerk's domain with our domain for session cookies
        let cookie = value;
        // Remove domain restriction so cookie works on our domain
        cookie = cookie.replace(/;\s*domain=[^;]+/gi, "");
        // Ensure path is set
        if (!cookie.toLowerCase().includes("path=")) {
          cookie = cookie + "; Path=/";
        }
        responseHeaders.append(key, cookie);
        return;
      }

      responseHeaders.set(key, value);
    });
    
    return new NextResponse(body, {
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
// Force auth redirects onto our own /sign-in and /sign-up routes (never accounts.*).
const clerkMiddlewareHandler = clerkMiddleware(
  async (auth, req: NextRequest) => {
    const origin = req.nextUrl.origin;

    if (!isPublicRoute(req)) {
      await auth.protect(undefined, {
        unauthenticatedUrl: `${origin}/sign-in`,
        unauthorizedUrl: `${origin}/sign-in`,
      });
    }

    // Get the response from the next handler
    const response = NextResponse.next();

    // Add security headers to all responses
    return addSecurityHeaders(response);
  },
  (req) => ({
    signInUrl: `${req.nextUrl.origin}/sign-in`,
    signUpUrl: `${req.nextUrl.origin}/sign-up`,
  }),
);

// Main middleware function - handle Clerk proxy before clerkMiddleware
export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  // Handle Clerk proxy requests first (before clerkMiddleware)
  if (isClerkProxyRoute(req)) {
    return handleClerkProxy(req);
  }
  
  // For all other routes, use clerkMiddleware
  return clerkMiddlewareHandler(req, event);
}
