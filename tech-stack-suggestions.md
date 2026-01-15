# Tech stack suggestions (restart: simplicity + speed)

This doc proposes a **new stack** to reimplement Tally with a bias toward:
- fast iteration
- one shared domain model
- minimal ops
- iOS + Android parity
- a great marketing site

---

## 0) Constraints / what matters for this product

Tally’s core is “**log entries fast + show progress clearly**”. The tech stack should optimize for:

- **Offline tolerance (eventual)**: users want to log quickly even with flaky connectivity
- **Simple relational data**: users → challenges → entries, plus follows
- **Straightforward auth**: email/password + OAuth later
- **Low backend surface area**: avoid building/maintaining a complex custom backend early
- **Shared contracts** across web + iOS + Android

---

## 1) Recommended approach (fastest path to parity)

### A) One app codebase for iOS + Android (+ optional web app)
**Expo (React Native) + TypeScript**

Why:
- One codebase for iOS + Android (and can run on web if desired)
- Extremely fast developer loop
- Huge ecosystem for UI, navigation, OTA updates, crash reporting

Suggested pieces:
- **Expo** + **Expo Router** (navigation)
- **TypeScript** end-to-end
- UI system:
  - Option 1: **NativeWind** (Tailwind-like styling) for speed
  - Option 2: **Tamagui** if you want shared design tokens + better cross-platform primitives
- Local persistence:
  - Start: **SQLite** (`expo-sqlite`) for caching
  - Later: add a small “outbox” table for queued writes

### B) Marketing site (separate, simple)
**Astro** (static) *or* **Next.js** (if you want one deployment)

- If you want the simplest, fastest, lowest-cost marketing site: **Astro** + static hosting.
- If you want tight integration with the app (shared components/auth/links): **Next.js**.

Recommendation:
- **Astro for marketing** (pure static), **Expo for the app**.

---

## 2) Backend recommendations

### Option 1 (recommended): Supabase (Postgres) + Row Level Security
**Supabase** gives you:
- Postgres (fits the relational model perfectly)
- Auth (email/password, OAuth)
- Storage (screenshots, attachments in future)
- Realtime (optional)
- Extremely low ops / fast setup

Cross-platform SDKs exist:
- Web/Expo: `@supabase/supabase-js`
- iOS: `supabase-swift`
- Android: community Kotlin clients (or use REST)

How Tally maps to Postgres:
- `users` (auth user id)
- `challenges` (FK user)
- `entries` (FK challenge + user, indexed by date)
- `follows` (FK user + challenge)

API approach:
- Start with Supabase client calls + RLS.
- Add **Edge Functions** only where needed (export bundles, heavy aggregation, leaderboard).

### Option 2: Firebase (Auth + Firestore)
This is the fastest “just ship” stack, but:
- Firestore queries + aggregations can get awkward
- Relational joins (owner info on public challenges) become denormalization work

### Option 3: Custom backend (when you outgrow BaaS)
If you want full control without a ton of ops:
- **Node.js (TypeScript)** + **Hono** or **Fastify**
- **Postgres** (Neon / Supabase / RDS)
- ORM: **Drizzle** (simple) or **Prisma** (more batteries)
- Auth: **Clerk** or **Auth.js**

This is more work than Supabase but still manageable.

---

## 3) Suggested “v1 rebuild” architecture (pragmatic)

### 3.1 Shared types / contracts
- Keep a `packages/shared/` that defines:
  - `Challenge`, `Entry`, `Follow` DTOs
  - request validation schemas

Good choices:
- **Zod** (if TypeScript everywhere)
- If you later add Swift/Kotlin native clients, generate types from OpenAPI.

### 3.2 API shape (keep it boring)
Even if you use Supabase directly, define the *logical* API you’re building:

- `POST /auth/session` (or provider equivalent)
- `GET /challenges?active=true`
- `POST /challenges`
- `PATCH /challenges/{id}`
- `GET /entries?challengeId=...`
- `POST /entries`
- `PATCH /entries/{id}`
- `DELETE /entries/{id}`
- `GET /public/challenges`
- `POST /follows`
- `DELETE /follows/{id}`
- `GET /leaderboard?range=week|month|year|all`

### 3.3 Data aggregation strategy (avoid premature complexity)
- Per-user stats (dashboard) can be computed client-side from fetched entries.
- Public/community pages need server aggregation:
  - total reps per public challenge
  - owner display name/avatar
  - follower counts

With Postgres:
- Use SQL views or RPC functions for leaderboard queries.

---

## 4) Observability + product analytics (minimal, high value)

- **Sentry**: crash + performance tracing (web + mobile)
- **PostHog** (or Amplitude): product analytics

Keep PII out of logs/analytics by default.

---

## 5) Feature flags (only if needed)

Don’t add flags until you have a clear use case.

If needed later:
- **LaunchDarkly** (best-in-class, paid)
- **GrowthBook** (cheaper/self-hostable)

---

## 6) CI/CD (keep it simple)

- Repo: GitHub
- CI: GitHub Actions
- Marketing deploy:
  - Astro: Cloudflare Pages / Vercel
  - Next.js: Vercel
- Mobile:
  - Expo EAS Build + EAS Submit (fastest path)

---

## 7) Concrete recommendation (if you want me to pick)

If the goal is *simplicity + speed* with minimal ops:

1. **Expo (React Native) + TypeScript** for iOS/Android (and optionally a shared web app)
2. **Astro** for the marketing site
3. **Supabase (Postgres + Auth + RLS)** for the backend
4. **Sentry + PostHog** for observability/analytics

This combination gets you to a shippable v1 quickly while keeping the data model clean and extensible.
