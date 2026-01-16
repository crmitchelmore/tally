import { NextRequest, NextResponse } from "next/server";

const CLERK_API = "https://frontend-api.clerk.dev";

async function proxyRequest(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace("/__clerk", "");
  const targetUrl = `${CLERK_API}${path}${url.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.set("origin", url.origin);

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: req.body,
    // @ts-expect-error - duplex is required for streaming body
    duplex: "half",
  });

  const responseHeaders = new Headers(response.headers);
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
