# Tally — Feature Map (current product)

This document is an **accurate inventory of the features that exist in this repo today**, so the product can be reimplemented in a new tech stack across:

- Web app (authenticated)
- Mobile apps (iOS + Android)
- Marketing site (public)

It also notes where functionality is **partial / stubbed**.

## Future ideas (from `docs/CORE-FLOWS.md`)

The feature inventory below reflects what’s implemented in this repo today. `docs/CORE-FLOWS.md` also includes a few behaviors that are **good candidates for future work** (or that differ from current behavior); we track them here so they don’t get lost:

- **Quick Add on challenge card (FLOW-012):** add a true quick-add UI on the dashboard challenge cards (today entry add is via sheets/dialogs).
- **Dedicated “Trends/Progress” dashboard view (FLOW-020):** add a focused trends route/surface (today the dashboard shows overall stats + challenge cards, not a separate trends page).
- **Community participant counts + real leaderboards (FLOW-030/031):** replace placeholders with real cross-user aggregation + participant metrics (see §8–9).
- **Weekly timeframe support:** `CORE-FLOWS` mentions `weekly`; today challenge timeframe units are `year | month | custom` (see §4.1).

(For completeness: **Sign out (FLOW-004)** is already supported via Clerk `UserButton afterSignOutUrl="/"` and `SignOutButton`.)

---

## 1) Product surfaces & routes

### Marketing site (public)
**Primary routes (Next.js App Router today):**

- `/` — landing page
  - CTA: **Sign in** (`/sign-in`), **Create an account** (`/sign-up`), **Open app** (`/app`)
  - Mentions iOS/Android coming soon
- `/ios` — placeholder page (links to `/app`, “coming soon” App Store button)
- `/android` — placeholder page (links to `/app`, “coming soon” Play Store button)

**Marketing components present:**
- Hero demo: `LandingHeroDemo`
- Showcase sections: `FeatureShowcase`, `HowItWorksSection`, `TestimonialsSection`, `StatsBar`, `LiveSyncDemo`, `AppShowcase`

Source: `tally-web/src/app/page.tsx`, `tally-web/src/components/marketing/*`

### Web app (authenticated)
**Primary route:**
- `/app` — main application shell (dashboard / challenge detail)

**Auth routes:**
- `/sign-in/[[...sign-in]]` — Clerk sign-in component
- `/sign-up/[[...sign-up]]` — Clerk sign-up component
- `/sign-in/sso-callback` — Clerk SSO callback
- `/sign-up/sso-callback` — Clerk SSO callback

**Debug routes (non-product, useful for development):**
- `/debug/auth` — debug auth info (exists in repo)
- `/test-components` — UI component test page (exists in repo)

**Infrastructure/auth support routes:**
- `/__clerk/*` — Clerk proxy route (Edge) used to keep OAuth/session handshakes on `tally-tracker.app` (avoids Cloudflare-for-SaaS conflicts)

Source: `tally-web/src/app/**` (notably `tally-web/src/app/__clerk/[...path]/route.ts`)

### Mobile apps
- `tally-ios/` — native iOS app scaffold + `TallyCore` Swift package (API client + models)
- `tally-android/` — native Android scaffold + `tallycore` module

Status: scaffolding + tests/CI hooks exist; core product UI is not yet parity with web (see §13).

---

## 2) Core domain model (what the app tracks)

### Entities

#### User
- `id` (internal DB id)
- `clerkId` (auth subject)
- `email?`, `name?`, `avatarUrl?`
- `createdAt`

#### Challenge
A user-defined goal over a time window.

Fields (current):
- `id`
- `userId` (owner)
- `name` (string)
- `targetNumber` (number)
- `color` (string; hex-like)
- `icon` (string; one of the allowed icons)
- `timeframeUnit`: `year | month | custom`
- `startDate?` (YYYY-MM-DD)
- `endDate?` (YYYY-MM-DD)
- `year` (number; used as display + defaults)
- `isPublic` (boolean)
- `archived` (boolean)
- `createdAt` (timestamp)

#### Entry
A logged increment toward a challenge on a date.

Fields (current):
- `id`
- `userId` (owner)
- `challengeId`
- `date` (YYYY-MM-DD)
- `count` (number)
- `note?` (string)
- `sets?` (array of `{ reps: number }`)
- `feeling?`: `very-easy | easy | moderate | hard | very-hard`
- `createdAt`

#### FollowedChallenge
A relationship: user follows a public challenge.

Fields:
- `id`
- `userId`
- `challengeId`
- `followedAt`

Source of truth (today): `tally-web/convex/schema.ts` and `tally-web/src/types/index.ts`

---

## 3) Authentication & user lifecycle

### 3.1 Signed-out experience
- Marketing landing page is visible signed-out.
- `/app` shows a signed-out prompt (“Get Started”) when not signed in.

### 3.2 Sign up / sign in
- Implemented via **Clerk** hosted components:
  - Sign-in page: `<SignIn ... />`
  - Sign-up page: `<SignUp ... />`
- Clerk proxy route exists to keep auth flows on our domain:
  - `/__clerk/*` proxies to `https://frontend-api.clerk.dev` and rewrites cookies/redirects to avoid Cloudflare Error 1000 issues when using Clerk’s Cloudflare-backed infrastructure.

Source: `tally-web/src/app/__clerk/[...path]/route.ts`, `tally-web/src/proxy.ts`

### 3.3 User creation/sync in backend
- On authenticated usage, the app ensures a backend `users` record exists for the Clerk subject.
- The Convex HTTP API includes `POST /api/v1/auth/user` which returns `{ userId, clerkId }` and creates the user if needed.

Source: `tally-web/src/app/app/page.tsx` (`useStoreUser`), `tally-web/convex/http.ts`

### 3.4 Access control / data isolation
- Challenges and entries are scoped to the authenticated user.
- Reads of a challenge/entry require either:
  - the user owns it, or
  - the challenge is public (for viewing)

Source: Convex auth helpers in `tally-web/convex/lib/auth` (enforced in queries/mutations).

---

## 4) Challenge management (create, view, edit, archive/delete)

### 4.1 Create challenge
**UI:** “New Challenge” dialog.

Inputs:
- Name
- Target number
- Timeframe: `year | month | custom`
  - Year: choose from current year → +4 years
  - Month: choose from a rolling list (current→next 12 months)
  - Custom: start date + duration (`customDays`), end date auto-calculated
- Color (from predefined palette)
- Icon (from predefined set)
- Public toggle (`isPublic`)

Behavior:
- Creates a challenge and navigates to its detail view.

Source: `tally-web/src/components/tally/CreateChallengeDialog.tsx`, Convex mutation `api.challenges.create`.

### 4.2 List active challenges (dashboard)
- Dashboard lists the user’s **active** challenges.
- “Active” logic (current):
  - excludes `archived`
  - if `endDate` exists: must be >= today
  - else: `year >= currentYear`

Source: Convex query `api.challenges.listActive`.

### 4.3 Challenge card summary
Each challenge card shows a quick overview (implementation-specific UI), powered by:
- Progress ring (current total vs target)
- Pace status (ahead/on-pace/behind)
- Mini heatmap activity

Source: `tally-web/src/components/tally/ChallengeCard.tsx`, stats utilities in `tally-web/src/lib/stats`.

### 4.4 Challenge detail view
From a challenge card, user can open a detailed screen:

Displays:
- Totals: total vs target
- Best day, current streak, longest streak, days active
- Heatmap calendar (large)
- Cumulative progress chart (actual vs target)
- Weekly average chart
- Recent entries list
- Analysis modules:
  - Sets & reps analysis
  - Sentiment/effort (feeling) analysis

Actions:
- Add entry
- Edit entry
- Delete entry
- Settings (if owner): edit challenge fields, toggle public/private, archive

Source: `tally-web/src/components/tally/ChallengeDetailView.tsx`, `ChallengeSettingsDialog.tsx`, `EditEntryDialog.tsx`, `DayEntriesDialog.tsx`.

### 4.5 Update challenge
Editable fields (current):
- `name`
- `targetNumber`
- `color`
- `icon`
- `isPublic`
- `archived`

Source: Convex mutation `api.challenges.update`.

### 4.6 Archive challenge
- Archive is supported and removes the challenge from the “active” list.

Source: Convex mutation `api.challenges.archive`.

### 4.7 Delete challenge
- There is a Convex mutation that hard-deletes a challenge and:
  - deletes all entries for that challenge
  - deletes all follow records for that challenge

Source: Convex mutation `api.challenges.remove`.

Note: the current web UI emphasizes **archive**; deletion UX depends on the settings dialog implementation.

---

## 5) Entry logging (add/edit/delete) + delight

### 5.1 Add entry (sheet)
There are **two** “Add Entry” sheets in the web UI:
- **AddEntrySheet**: global sheet that lets you pick a challenge (auto-selects if only 1 challenge).
- **AddEntryDetailSheet**: sheet scoped to a single challenge (used from the challenge detail screen).

**Entry methods:**
- Simple count
- Sets & reps (sum of reps becomes `count`, sets stored in `sets[]`)

Entry fields:
- Date (defaults to today; cannot be set in the future)
- Count or sets
- Optional note
- Optional feeling/effort rating

Delight + accessibility:
- Confetti effect on submit (disabled if user prefers reduced motion)
- Light haptics via `navigator.vibrate` when available

Source: `tally-web/src/components/tally/AddEntrySheet.tsx`, `tally-web/src/components/tally/AddEntryDetailSheet.tsx`. 

### 5.2 Edit entry
- Edit count/note/date/feeling.

Source: `EditEntryDialog.tsx`, Convex mutation `api.entries.update`.

### 5.3 Delete entry
- Removes a single entry.

Source: Convex mutation `api.entries.remove`.

### 5.4 Per-day drilldown
- Heatmap days with activity can be clicked to view entries for that day.

Source: `HeatmapCalendar.tsx` + `DayEntriesDialog.tsx`.

---

## 6) Stats & insights

### 6.1 Challenge-level stats (computed)
Calculated values used throughout the UI:
- total
- remaining
- days left in timeframe
- required per day
- pace status (ahead/onPace/behind) + paceOffset
- streaks (current, longest)
- best day
- average per day
- days active

Source: `tally-web/src/lib/stats`.

### 6.2 Overall stats (across all challenges)
- Dashboard summary aggregating user’s challenges/entries.

Source: `tally-web/src/components/tally/OverallStats.tsx`.

### 6.3 Personal records
- Highlights “best performances” across the dataset.

Source: `tally-web/src/components/tally/PersonalRecords.tsx`.

### 6.4 Weekly summary
A modal showing a weekly report:
- Total reps
- Daily average
- Entries logged
- Active challenges
- Best day
- Challenge breakdown
- Day-by-day bar visualization
- Navigation to previous weeks

Source: `tally-web/src/components/tally/WeeklySummaryDialog.tsx`, `tally-web/src/lib/weeklySummary`.

---

## 7) Data management (backup/restore)

### 7.1 Export
Export formats:
- JSON
- CSV

Export includes:
- All challenges
- All entries
- Optional `userId` annotation (export only)

File naming:
- `tally-backup-YYYY-MM-DD.json`
- `tally-backup-YYYY-MM-DD.csv`

Source: `tally-web/src/lib/exportImport.ts`, `ExportImportDialog.tsx`.

### 7.2 Import
- Accepts JSON or CSV produced by the exporter.
- Performs validation and shows warnings/errors.
- Import behavior: **replaces all existing user data**.

Server-side import behavior (current):
- Deletes all existing entries, challenges, and follows for the user.
- Inserts imported challenges.
- Maps imported `challengeId` strings → newly created DB IDs.
- Inserts imported entries using the mapped IDs.

Source: Convex mutation `api.import.bulkImport`.

### 7.3 Clear all data
- Deletes all entries, challenges, and follows for the signed-in user.

Source: Convex mutation `api.import.clearAllData`.

---

## 8) Community features (public challenges + following)

### 8.1 Public challenges list
- A “Public Challenges” view exists.
- Supports:
  - search by challenge name (and owner name if present)
  - follow/unfollow
  - highlights your own challenges

Important accuracy note (current state):
- The view currently displays **placeholder** values for:
  - `totalReps`
  - `progress`
  - `ownerName` / `ownerAvatarUrl`

These require server-side aggregation + join to users to become real.

Source: `tally-web/src/components/tally/PublicChallengesView.tsx`, Convex query `api.challenges.listPublic`.

### 8.2 Follow/unfollow
- User can follow a challenge (only public, unless it’s their own).
- Followed challenges appear in a “Following” section on the dashboard.

Source:
- Convex mutations: `api.followedChallenges.follow`, `api.followedChallenges.unfollow`
- Dashboard UI: `FollowedChallengeCard.tsx`

---

## 9) Leaderboard

A leaderboard UI exists with:
- Time ranges: week, month, year, all-time
- Tabs: Global vs My Ranks

Important accuracy note (current state):
- The UI is **not backed by real cross-user entry aggregation** (so `totalReps`, `progress`, `daysActive`, usernames/avatars are placeholders).
- The HTTP endpoint `GET /api/v1/leaderboard` exists, but today it only returns **public challenges + follower counts** (sorted by followers) — not rep totals and not time-range aware.

Source: `tally-web/src/components/tally/LeaderboardView.tsx`, `tally-web/convex/http.ts`, `tally-web/convex/followedChallenges.ts`. 

---

## 10) API (for mobile clients / integrations)

The app exposes a versioned HTTP API intended for mobile.

### Base URL
- `https://<deployment>.convex.site/api/v1`

### Authentication
- Bearer token (Clerk JWT): `Authorization: Bearer <token>`

### Endpoints (v1)
- `POST /auth/user`
- `GET /challenges?active=true|false`
- `POST /challenges`
- `PATCH /challenges/{id}`
- `GET /entries?challengeId=...` or `GET /entries?date=YYYY-MM-DD`
- `POST /entries`
- `PATCH /entries/{id}`
- `DELETE /entries/{id}`
- `GET /followed`
- `POST /followed`
- `DELETE /followed/{id}`
- `GET /public/challenges` (no auth)
- `GET /leaderboard` (no auth) — currently returns public challenges + follower counts (not rep totals)

Notes:
- Legacy compatibility aliases also exist under `/api/*` (deprecated; `/api/v1/*` recommended).

Source: `docs/API.md`, `tally-web/convex/http.ts`. 

---

## 11) Analytics, observability, and feature flags

These exist in the repo and should be reimplemented (or intentionally dropped) in the restart.

### 11.1 Analytics (PostHog)
- Web uses PostHog (`posthog-js`) with optional Clerk user identification.
- There is a cross-platform event taxonomy in `docs/ANALYTICS.md` intended to align web/iOS/Android.

Source: `tally-web/src/providers/posthog-provider.tsx`, `tally-web/src/lib/analytics.ts`, `docs/ANALYTICS.md`

### 11.2 Error reporting / performance (Sentry)
- Web includes Sentry configuration + a provider to sync Clerk user context.

Source: `tally-web/sentry.*.config.ts`, `tally-web/src/providers/sentry-provider.tsx`, `tally-web/src/hooks/use-sentry-user.ts`

### 11.3 Feature flags (LaunchDarkly)
- Web initializes LaunchDarkly client-side and identifies the user (via Clerk when available).
- Convex registers LaunchDarkly webhook routes for flag sync.

Source: `tally-web/src/providers/feature-flags-provider.tsx`, `tally-web/convex/http.ts`, `tally-web/convex/lib/launchdarkly.ts`

---

## 12) Cross-cutting UX requirements (must preserve)

### 11.1 Performance + perceived speed
- Fast “tap to log” entry flow.
- Avoid spinners; prefer skeletons/progressive rendering.

### 11.2 Accessibility
- Respect reduced-motion preferences (confetti/animations should disable).
- Large tap targets for key actions (especially Add Entry).

Source signal: reduced-motion hooks used in Add Entry UI and dashboard animations.

### 11.3 Calm, friendly feel
- Delights are subtle (microinteractions), not noisy.

---

## 13) Mobile parity status (truthfully)

The repo contains **native scaffolds** and a defined API contract for iOS/Android, but the full product feature set is primarily implemented on **web** today.

What’s concretely defined for mobile parity:
- Canonical flows + tests enumerated in `key-journeys.md` and `docs/CORE-FLOWS.md`.
- A versioned HTTP API (`/api/v1`) intended for mobile clients.

What is not yet implemented to full parity (as of this repo state):
- Full native UI for the web feature set (challenge dashboard/detail, charts, export/import, community, leaderboard).

---

## 14) Reimplementation checklist (feature grouping)

Use this as the “what to rebuild” list:

1. Marketing site
   - Landing page with product messaging + CTAs
   - iOS/Android “coming soon” pages
   - App store listing copy + asset pipeline
2. Auth
   - Email/password sign-up and sign-in (or equivalent)
   - Backend user provisioning
3. Challenges
   - Create (year/month/custom)
   - List active
   - Detail + settings
   - Update, archive, delete
4. Entries
   - Add (count or sets)
   - Edit + delete
   - Per-day drilldown
5. Stats
   - Challenge stats (pace + streaks + charts)
   - Overall stats + personal records
   - Weekly summary
6. Data portability
   - Export JSON/CSV
   - Import JSON/CSV (replace-all semantics)
   - Clear all
7. Community
   - Public challenges list + search
   - Follow/unfollow
   - (Missing today) real aggregated totals + owner info
8. Leaderboard
   - UI exists
   - (Missing today) real aggregation across users
