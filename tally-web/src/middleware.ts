import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const CLERK_API = "https://frontend-api.clerk.dev";
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

const isPublicRoute = createRouteMatcher([
  "/",
  "/ios",
  "/android",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/v1/public/(.*)",
  "/api/v1/leaderboard",
  "/api/clerk-proxy(.*)",
]);

async function handleClerkProxy(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  // Extract path after /api/clerk-proxy
  const clerkPath = url.pathname.replace("/api/clerk-proxy", "");
  const targetUrl = `${CLERK_API}${clerkPath}${url.search}`;

  const headers = new Headers();
  // Copy only safe headers
  const safeHeaders = [
    "content-type",
    "accept",
    "accept-language",
    "cookie",
    "user-agent",
    "sec-fetch-site",
    "sec-fetch-mode",
    "sec-fetch-dest",
  ];
  for (const header of safeHeaders) {
    const value = req.headers.get(header);
    if (value) {
      headers.set(header, value);
    }
  }

  headers.set("origin", url.origin);
  headers.set("Clerk-Proxy-Url", "https://tally-tracker.app/api/clerk-proxy");
  if (CLERK_SECRET_KEY) {
    headers.set("Clerk-Secret-Key", CLERK_SECRET_KEY);
  }
  const forwarded =
    req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
  if (forwarded) {
    headers.set("X-Forwarded-For", forwarded);
  }

  // Read body as ArrayBuffer
  let body: ArrayBuffer | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: body,
    redirect: "manual",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");

  const setCookie = responseHeaders.get("set-cookie");
  if (setCookie) {
    const rewritten = setCookie.replace(/domain=[^;]+;?/gi, "");
    responseHeaders.set("set-cookie", rewritten);
  }

  const location = responseHeaders.get("location");
  if (location && location.includes("frontend-api.clerk.dev")) {
    responseHeaders.set(
      "location",
      location.replace(
        "https://frontend-api.clerk.dev",
        "https://tally-tracker.app/api/clerk-proxy"
      )
    );
  }

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export default clerkMiddleware(async (auth, req) => {
  // Handle Clerk proxy requests in middleware
  if (req.nextUrl.pathname.startsWith("/api/clerk-proxy")) {
    return handleClerkProxy(req);
  }

  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
