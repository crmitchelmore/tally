import { NextRequest, NextResponse } from "next/server";

const CLERK_API = "https://frontend-api.clerk.dev";
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

async function proxyRequest(
  req: NextRequest,
  context: { params: Promise<{ segments: string[] }> }
): Promise<Response> {
  const { segments } = await context.params;
  const url = new URL(req.url);
  // Build the Clerk API path from the segments
  const clerkPath = "/" + segments.join("/");
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
  // Required headers for Clerk proxy
  headers.set("Clerk-Proxy-Url", "https://tally-tracker.app/api/clerk-proxy");
  if (CLERK_SECRET_KEY) {
    headers.set("Clerk-Secret-Key", CLERK_SECRET_KEY);
  }
  // Forward client IP
  const forwarded =
    req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
  if (forwarded) {
    headers.set("X-Forwarded-For", forwarded);
  }

  // Read body as ArrayBuffer to ensure it's passed through unchanged
  let body: ArrayBuffer | null = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = await req.arrayBuffer();
  }

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: body,
    redirect: "manual", // Handle redirects ourselves
  });

  const responseHeaders = new Headers(response.headers);
  // Remove headers that shouldn't be proxied
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");

  // Rewrite Set-Cookie domain if present
  const setCookie = responseHeaders.get("set-cookie");
  if (setCookie) {
    const rewritten = setCookie.replace(/domain=[^;]+;?/gi, "");
    responseHeaders.set("set-cookie", rewritten);
  }

  // Handle redirects - rewrite location header to use proxy URL
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

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;

export const runtime = "edge";
