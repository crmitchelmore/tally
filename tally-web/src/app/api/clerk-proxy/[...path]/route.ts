import { NextRequest, NextResponse } from "next/server";

const CLERK_API = "https://frontend-api.clerk.dev";
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;

async function proxyRequest(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  // Extract path after /api/clerk-proxy
  const path = url.pathname.replace("/api/clerk-proxy", "");
  const targetUrl = `${CLERK_API}${path}${url.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.set("origin", url.origin);
  // Required headers for Clerk proxy
  headers.set("Clerk-Proxy-Url", "https://tally-tracker.app/.clerk");
  if (CLERK_SECRET_KEY) {
    headers.set("Clerk-Secret-Key", CLERK_SECRET_KEY);
  }
  // Forward client IP
  const forwarded = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
  if (forwarded) {
    headers.set("X-Forwarded-For", forwarded);
  }

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: req.body,
    // @ts-expect-error - duplex is required for streaming body
    duplex: "half",
    redirect: "follow",
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
