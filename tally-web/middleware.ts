// Export the Clerk middleware from proxy.ts
// Next.js requires middleware.ts to be in the project root (or src/ root)
export { default } from "./src/proxy";

// Config must be defined here directly, not re-exported
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next (all Next.js internal paths: static, image, etc.)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder files (svg, png, jpg, etc.)
     * - css and js files (but not json)
     */
    "/((?!_next|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot|css|js(?!on))).*)",
  ],
};
