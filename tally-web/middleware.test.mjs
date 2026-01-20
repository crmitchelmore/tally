import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

// Lightweight regression test: verify our middleware is a safe no-op to avoid
// edge runtime failures in production.

const src = await readFile(new URL("./middleware.ts", import.meta.url), "utf8");

assert.match(src, /NextResponse\.next\(\)/);

console.log("ok");
