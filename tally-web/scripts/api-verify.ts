export {};

const base = process.env.TALLY_API_BASE ?? "https://bright-jackal-396.convex.site";
const jwt = process.env.TALLY_JWT;

type Expect = { status: number };

async function request(path: string, init: RequestInit, expect: Expect) {
  const res = await fetch(`${base}${path}`, init);
  if (res.status !== expect.status) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `${init.method ?? "GET"} ${path}: expected ${expect.status}, got ${res.status}${body ? `\n${body}` : ""}`
    );
  }
  return res;
}

function authHeaders() {
  if (!jwt) {
    throw new Error(
      "TALLY_JWT is required for api:verify.\n" +
        "Get one from the web app (see docs/migration/PROJECT-2-API.md) and run:\n" +
        "TALLY_JWT=... bun run api:verify"
    );
  }

  return {
    Authorization: `Bearer ${jwt}`,
    "Content-Type": "application/json",
  };
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  console.log(`API base: ${base}`);

  const headers = authHeaders();

  const authRes = await request(
    "/api/auth/user",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: "api-verify@tally-tracker.app",
        name: "API Verify",
      }),
    },
    { status: 200 }
  );

  const authBody = (await authRes.json()) as { userId: string; clerkId: string };
  if (!authBody?.userId || !authBody?.clerkId) throw new Error("/api/auth/user: missing userId/clerkId");

  const createChallengeRes = await request(
    "/api/challenges",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: `API Verify ${Date.now()}`,
        targetNumber: 10,
        year: new Date().getFullYear(),
        color: "#3b82f6",
        icon: "dumbbell",
        timeframeUnit: "year",
        isPublic: false,
      }),
    },
    { status: 201 }
  );

  const { id: challengeId } = (await createChallengeRes.json()) as { id: string };
  if (!challengeId) throw new Error("/api/challenges POST: missing id");

  await request(
    "/api/challenges?active=true",
    {
      method: "GET",
      headers: { Authorization: headers.Authorization },
    },
    { status: 200 }
  );

  await request(
    `/api/challenges/${challengeId}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        name: `API Verify Updated ${Date.now()}`,
        archived: false,
      }),
    },
    { status: 200 }
  );

  const createEntryRes = await request(
    "/api/entries",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        challengeId,
        date: todayIso(),
        count: 1,
        note: "api:verify",
      }),
    },
    { status: 201 }
  );

  const { id: entryId } = (await createEntryRes.json()) as { id: string };
  if (!entryId) throw new Error("/api/entries POST: missing id");

  await request(
    `/api/entries?challengeId=${encodeURIComponent(challengeId)}`,
    {
      method: "GET",
      headers: { Authorization: headers.Authorization },
    },
    { status: 200 }
  );

  await request(
    `/api/entries/${entryId}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ count: 2 }),
    },
    { status: 200 }
  );

  await request(
    "/api/followed",
    {
      method: "POST",
      headers,
      body: JSON.stringify({ challengeId }),
    },
    { status: 201 }
  );

  await request(
    "/api/followed",
    {
      method: "GET",
      headers: { Authorization: headers.Authorization },
    },
    { status: 200 }
  );

  await request(
    `/api/followed/${challengeId}`,
    {
      method: "DELETE",
      headers: { Authorization: headers.Authorization },
    },
    { status: 200 }
  );

  await request(
    `/api/entries/${entryId}`,
    {
      method: "DELETE",
      headers: { Authorization: headers.Authorization },
    },
    { status: 200 }
  );

  // Best-effort cleanup: archive the challenge.
  await request(
    `/api/challenges/${challengeId}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ archived: true }),
    },
    { status: 200 }
  );

  console.log("API verify OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
