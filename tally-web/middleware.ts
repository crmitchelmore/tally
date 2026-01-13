// Export the Clerk middleware from proxy.ts
// Next.js requires middleware.ts to be in the project root (or src/ root)
export { default } from "./src/proxy";

// Config must be defined here directly, not re-exported
export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Clerk proxy route
    "/__clerk/:path*",
  ],
};
