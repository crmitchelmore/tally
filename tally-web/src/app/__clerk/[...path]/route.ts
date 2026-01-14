import { NextRequest, NextResponse } from "next/server";
import { getClerkSecretKey } from "@/lib/clerk-server";

export const runtime = "edge";

function splitSetCookieHeader(value: string): string[] {
  const parts: string[] = [];
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    if (value[i] !== ",") continue;

    const rest = value.slice(i + 1);
    const m = rest.match(/^\s*([^=;\s]+)=/);
    if (m) {
      parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
}

async function proxyClerk(req: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const url = req.nextUrl;

  const debug = process.env.CLERK_PROXY_DEBUG === "true";

  const clerkUrl = new URL(`/${path.join("/")}`, "https://frontend-api.clerk.dev");
  clerkUrl.search = url.search;

  const headers = new Headers(req.headers);
  const proxyUrl = `${url.origin}/__clerk`;
  headers.set("Clerk-Proxy-Url", proxyUrl);

  const secretKey = getClerkSecretKey();
  if (secretKey) headers.set("Clerk-Secret-Key", secretKey);

  headers.delete("host");

  if (debug && clerkUrl.pathname.includes("/oauth_callback")) {
    console.log("[clerk-route] oauth_callback request", {
      method: req.method,
      clerkUrl: clerkUrl.toString(),
      proxyUrl,
    });
  }

  const upstream = await fetch(clerkUrl.toString(), {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    // @ts-expect-error - duplex is required for streaming body but not in types
    duplex: "half",
  });

  const contentType = upstream.headers.get("content-type") || "";
  let body = await upstream.arrayBuffer();

  if (/^text\/(html|javascript)/i.test(contentType) || /^application\/(javascript|json)/i.test(contentType)) {
    const decoded = new TextDecoder().decode(body);
    const origin = url.origin;
    const rewritten = decoded
      .replaceAll("https://accounts.tally-tracker.app", origin)
      .replaceAll("https://clerk.tally-tracker.app", `${origin}/__clerk`);
    if (rewritten !== decoded) {
      body = new TextEncoder().encode(rewritten).buffer;
    }
  }

  const responseHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey === "content-encoding" || lowerKey === "transfer-encoding") return;
    if (lowerKey === "set-cookie") return;

    if (lowerKey === "location") {
      let location = value;
      const origin = url.origin;
      if (location.startsWith("https://frontend-api.clerk.dev")) {
        location = `${origin}/__clerk${location.replace("https://frontend-api.clerk.dev", "")}`;
      } else if (location.startsWith("/v1")) {
        location = `/__clerk${location}`;
      } else if (
        location.startsWith("https://accounts.tally-tracker.app") ||
        location.startsWith("https://clerk.tally-tracker.app")
      ) {
        const parsed = new URL(location);
        location = `${origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
      responseHeaders.set(key, location);
      return;
    }

    responseHeaders.set(key, value);
  });

  const getSetCookie = (upstream.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
  const setCookies = getSetCookie?.call(upstream.headers) ?? [];
  const fallbackSetCookie = upstream.headers.get("set-cookie");

  const cookiesToAppend = setCookies.length
    ? setCookies
    : (fallbackSetCookie ? splitSetCookieHeader(fallbackSetCookie) : []);

  if (debug && clerkUrl.pathname.includes("/oauth_callback")) {
    console.log("[clerk-route] oauth_callback response", {
      status: upstream.status,
      setCookieCount: cookiesToAppend.length,
      location: upstream.headers.get("location"),
    });
  }

  for (const value of cookiesToAppend) {
    let cookie = value;
    cookie = cookie.replace(/;\s*domain=[^;]+/gi, "");
    // Ensure cookies are available site-wide (critical when Clerk is proxied under /__clerk)
    cookie = cookie.toString().match(/;\s*path=/i)
      ? cookie.replace(/;\s*path=[^;]+/i, "; Path=/")
      : cookie + "; Path=/";
    responseHeaders.append("set-cookie", cookie);
  }

  return new NextResponse(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyClerk(req, ctx.params);
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyClerk(req, ctx.params);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyClerk(req, ctx.params);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyClerk(req, ctx.params);
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyClerk(req, ctx.params);
}

export async function OPTIONS(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxyClerk(req, ctx.params);
}
