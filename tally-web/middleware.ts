import type { NextFetchEvent, NextRequest } from "next/server";

const clerkPublishableKey =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? process.env.CLERK_PUBLISHABLE_KEY;
const hasClerkEnv = !!clerkPublishableKey && !!process.env.CLERK_SECRET_KEY;

const publicRouteMatchers = [
  /^\/$/,
  /^\/sign-in(?:\/.*)?$/,
  /^\/sign-up(?:\/.*)?$/,
  /^\/__clerk(?:\/.*)?$/,
  /^\/api\/v1\/auth\/user$/,
  /^\/api\/v1\/public(?:\/.*)?$/,
  /^\/api\/auth\/user$/,
  /^\/api\/public(?:\/.*)?$/,
];

const isPublicRoute = (pathname: string) =>
  publicRouteMatchers.some((matcher) => matcher.test(pathname));

function ensureNavigator(userAgent: string | null) {
  if (typeof (globalThis as { navigator?: { userAgent?: string } }).navigator === "undefined") {
    (globalThis as { navigator?: { userAgent?: string } }).navigator = {
      userAgent: userAgent ?? "",
    };
    return;
  }
  if (!(globalThis as { navigator?: { userAgent?: string } }).navigator?.userAgent && userAgent) {
    (globalThis as { navigator?: { userAgent?: string } }).navigator = { userAgent };
  }
}

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  ensureNavigator(req.headers.get("user-agent"));
  const { NextResponse } = await import("next/server");
  if (!hasClerkEnv) {
    return NextResponse.next();
  }
  const { clerkMiddleware } = await import("@clerk/nextjs/server");
  const handler = clerkMiddleware(async (auth, request, _event) => {
    const pathname = new URL(request.url).pathname;
    if (!isPublicRoute(pathname)) {
      const { userId } = await auth();
      if (!userId) {
        if (pathname.startsWith("/api")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }
    }
  });
  return handler(req, event);
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
