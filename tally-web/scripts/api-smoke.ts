export {};

const base = process.env.TALLY_API_BASE ?? "https://bright-jackal-396.convex.site";

type Expect = { status: number };

async function request(path: string, init: RequestInit, expect: Expect) {
  const res = await fetch(`${base}${path}`, init);
  if (res.status !== expect.status) {
    const body = await res.text().catch(() => "");
    throw new Error(`${init.method ?? "GET"} ${path}: expected ${expect.status}, got ${res.status}${body ? `\n${body}` : ""}`);
  }
  return res;
}

async function main() {
  console.log(`API base: ${base}`);

  await request("/api/public/challenges", { method: "GET" }, { status: 200 });
  await request("/api/leaderboard", { method: "GET" }, { status: 200 });
  await request("/api/public/challenges", { method: "OPTIONS" }, { status: 204 });

  // Auth should be enforced.
  await request("/api/challenges", { method: "GET" }, { status: 401 });

  console.log("API smoke OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
