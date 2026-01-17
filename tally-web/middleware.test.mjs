import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Lightweight regression test: verify our middleware includes a guard that
// prevents hard failures when Clerk env vars are missing.
// (Importing Next middleware in plain Node isn't reliable.)

const src = await readFile(new URL("./middleware.ts", import.meta.url), "utf8");

assert.match(src, /const hasClerkEnv\s*=\s*/);
assert.match(src, /NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY/);
assert.match(src, /CLERK_SECRET_KEY/);
assert.match(src, /\? clerkMiddleware\(/);
assert.match(src, /NextResponse\.next\(\)/);

console.log("ok");
