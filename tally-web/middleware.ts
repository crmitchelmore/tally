import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * If Clerk env isn't configured (misconfigured deploy, preview env, local dev),
 * Clerk's middleware can throw at runtime which surfaces as:
 *   x-vercel-error: MIDDLEWARE_INVOCATION_FAILED
 *
 * In that case, fall back to a no-op middleware so the app can still serve
 * public pages and non-auth endpoints instead of returning 500 for everything.
 */
const hasClerkEnv =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

const isPublicRoute = createRouteMatcher([
  "/",
  "/app(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/__clerk(.*)",
  "/api/v1/auth/user",
  "/api/v1/public(.*)",
  "/api/auth/user",
  "/api/public(.*)",
]);

export default hasClerkEnv
  ? clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        const { userId } = await auth();
        if (!userId) {
          if (req.nextUrl.pathname.startsWith("/api")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
          }
          return NextResponse.redirect(new URL("/sign-in", req.url));
        }
      }
    })
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ((req: any) => NextResponse.next());

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/(api|trpc)(.*)"],
};
