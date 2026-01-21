import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Polyfill navigator for Clerk SDK edge compatibility
function ensureNavigator(req: NextRequest) {
  if (typeof globalThis.navigator === "undefined") {
    (globalThis as unknown as { navigator: { userAgent: string } }).navigator = {
      userAgent: req.headers.get("user-agent") ?? "node",
    };
  }
}

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/offline(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/__clerk(.*)",
  "/api/v1/public(.*)",
  "/api/v1/auth/user",
]);

// Conditionally apply Clerk middleware only when keys are available
const hasClerkKeys =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "string" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0;

export default async function middleware(req: NextRequest) {
  ensureNavigator(req);

  // Let vercel.json handle clerk.tally-tracker.app proxy
  const host = req.headers.get("host") ?? "";
  if (host.startsWith("clerk.")) {
    return NextResponse.next();
  }

  if (!hasClerkKeys) {
    // Skip auth checks during builds or when keys are missing
    return NextResponse.next();
  }

  const clerk = clerkMiddleware(async (auth, request) => {
    const { pathname } = request.nextUrl;

    if (!isPublicRoute(request)) {
      const { userId } = await auth();
      if (!userId) {
        // API routes return 401 JSON
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
          );
        }
        // Pages redirect to sign-in
        const signInUrl = new URL("/sign-in", request.url);
        signInUrl.searchParams.set("redirect_url", pathname);
        return NextResponse.redirect(signInUrl);
      }
    }

    return NextResponse.next();
  });

  return clerk(req, {} as never);
}

export const config = {
  matcher: [
    // Skip static files and Next.js internals
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
