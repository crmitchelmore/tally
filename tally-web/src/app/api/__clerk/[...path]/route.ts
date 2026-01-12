import { NextRequest, NextResponse } from "next/server";

/**
 * Clerk Frontend API Proxy
 * 
 * This proxy route forwards requests from /__clerk/* to Clerk's Frontend API.
 * Required because:
 * 1. Our DNS (Cloudflare) points clerk.tally-tracker.app to Clerk's Cloudflare
 * 2. Clerk uses Cloudflare for SaaS which requires custom hostname registration
 * 3. Until Clerk completes that registration, we get Cloudflare Error 1000
 * 
 * This proxy bypasses the DNS issue by forwarding directly to Clerk's API.
 */

const CLERK_FRONTEND_API = "https://frontend-api.clerk.dev";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyToClerk(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyToClerk(request, await params);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyToClerk(request, await params);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyToClerk(request, await params);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return proxyToClerk(request, await params);
}

async function proxyToClerk(
  request: NextRequest,
  params: { path: string[] }
) {
  const path = params.path.join("/");
  const url = new URL(request.url);
  const targetUrl = `${CLERK_FRONTEND_API}/${path}${url.search}`;

  // Forward headers, adding required Clerk proxy headers
  const headers = new Headers();
  
  // Copy relevant headers from original request
  const headersToForward = [
    "accept",
    "accept-language",
    "content-type",
    "authorization",
    "clerk-client",
    "x-clerk-client",
    "cookie",
  ];
  
  for (const header of headersToForward) {
    const value = request.headers.get(header);
    if (value) {
      headers.set(header, value);
    }
  }

  // Add proxy-specific headers required by Clerk
  const proxyUrl = `${url.origin}/__clerk`;
  headers.set("Clerk-Proxy-Url", proxyUrl);
  
  // Get secret key from environment
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (secretKey) {
    headers.set("Clerk-Secret-Key", secretKey);
  }
  
  // Forward client IP
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() 
    || request.headers.get("x-real-ip")
    || "127.0.0.1";
  headers.set("X-Forwarded-For", clientIp);

  try {
    // Get request body for non-GET requests
    let body: BodyInit | null = null;
    if (request.method !== "GET" && request.method !== "HEAD") {
      body = await request.text();
    }

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

    // Create response with Clerk's response
    const responseHeaders = new Headers(response.headers);
    
    // Remove headers that shouldn't be forwarded
    responseHeaders.delete("transfer-encoding");
    
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Clerk proxy error:", error);
    return NextResponse.json(
      { error: "Proxy error", message: String(error) },
      { status: 502 }
    );
  }
}
