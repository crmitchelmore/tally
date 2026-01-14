# Local-only mode plan (Web + iOS + Android)

## Goal
Add a **Local-only** option across all 3 platforms (Web, iOS, Android) so users can:
- Use **all core challenge functionality** without an account.
- Store all data **locally on the device**.
- **Not** have sync and **not** access community boards.
- See clear, persistent UI that they can **migrate to a synced account** by creating an account.
- Still **import/export** data as normal.

This is an *offline-first* experience, but specifically **single-device** until the user creates an account.

---

## Product / UX requirements

### Entry points
- **Onboarding**: Offer two primary actions:
  1) **Continue locally (no account)**
  2) **Create account / Sign in (sync across devices)**
- **Settings**: Always show:
  - Current mode: `Local-only` or `Synced`
  - CTA: `Upgrade to sync` (local-only only)

### Persistent clarity
Local-only users should never wonder why things don’t sync.
- Add a small, calm **mode indicator**:
  - Web: top app chrome (e.g., header badge)
  - iOS/Android: in main toolbar overflow + settings + optional non-intrusive banner
- Copy must clearly state:
  - “Your data is stored only on this device.”
  - “Create an account to sync across devices and access community boards.”

### Feature availability
| Feature | Local-only | Synced |
|---|---:|---:|
| Challenges (create/edit/archive) | ✅ | ✅ |
| Check-ins / progress tracking | ✅ | ✅ |
| Streaks, stats, reminders (device-local) | ✅ | ✅ |
| Import / Export | ✅ | ✅ |
| Sync across devices | ❌ | ✅ |
| Community boards | ❌ | ✅ |

### Handling restricted features
- Community boards entry points should be visible but gated:
  - Show a friendly paywall-style screen: “Community requires an account” with `Create account` CTA.
- Any UI that implies multi-device behavior must be removed/hidden in local-only.

### Migration (upgrade) expectations
- Local-only users can upgrade at any time.
- Upgrade should:
  1) Create/sign-in to account
  2) Offer **migrate local data into the account**
  3) After success, mode flips to **Synced**

**MVP migration policy (recommended):**
- If the user creates a **new account** (no existing server data), auto-migrate local → cloud.
- If the user signs in to an **existing account**, show a choice:
  - `Replace cloud with this device` (destructive)
  - `Keep cloud and discard local` (destructive)
  - `Merge (coming soon)` (disabled / future)

---

## Data model & architecture (shared approach)

### Core idea: a storage abstraction
Introduce a storage layer contract used by UI + domain logic on every platform.

**Interface (conceptual):**
- `DataStore` (single API)
  - `getChallenges()` / `putChallenge()` / `deleteChallenge()`
  - `getCheckins(challengeId)` / `putCheckin()` / ...
  - `export()` / `import(payload)`
  - (Synced-only) `syncNow()` / `subscribe()` etc.

Provide two implementations:
- `LocalDataStore` (always available)
- `SyncedDataStore` (wraps Convex/remote)

The app runs in one of two modes:
- `local-only`: uses `LocalDataStore`
- `synced`: uses `SyncedDataStore` (may also maintain local cache for offline, but that’s optional and can come later)

### Identity & IDs
To enable clean migration, local-only data must have stable IDs.
- Use UUIDv4 (or equivalent) for:
  - challengeId, checkinId, etc.
- Store `createdAt`, `updatedAt` timestamps.
- Keep schema versioned for import/export.

### Import/export compatibility
Import/export must work in both modes:
- Export should serialize the same canonical format across platforms.
- Import should:
  - Validate schema + version
  - Support id remapping only if needed (prefer not)

**Recommendation:** define a single “Tally Export” JSON schema in `packages/` so all platforms share it.

### Mode selection and persistence
- Persist mode as a simple local flag:
  - `appMode = local-only | synced`
- Persist “migration completed” state.

---

## Platform-specific implementation plan

### Web (Next.js + Convex + Clerk)
**Local storage choice:** prefer **IndexedDB** (via a small wrapper) for reliability and size.
- `localStorage` can hold only small metadata (e.g., appMode), not the dataset.

Tasks:
1) Add onboarding option `Continue locally`.
2) Add `LocalDataStore` implementation:
   - IndexedDB tables: `challenges`, `checkins`, `settings`, `exportMeta`
3) Add gating:
   - Community routes/pages -> show account CTA
   - Remove/disable sync indicators
4) Add migration flow:
   - When user signs up, run `export()` from local store and import into Convex.
   - On success: set mode = synced, optionally clear local db after confirmation.
5) Import/export:
   - Export pulls from whichever store is active.
   - Import writes into active store.

Notes:
- For web, local-only should not require Clerk at all.
- Ensure anonymous local-only sessions do not call Convex.

### iOS
**Local storage choice:**
- MVP: **SQLite** (via GRDB) or **Core Data**.
- Store appMode in `UserDefaults`.

Tasks:
1) Add onboarding fork: `Continue locally`.
2) Implement `LocalDataStore` with persistence.
3) Gate community UI.
4) Migration:
   - After account creation/sign-in, export local payload and send to backend (Convex HTTP endpoint or GraphQL layer—align with current mobile API approach).
5) Import/export:
   - Export as JSON file via share sheet.
   - Import via Files picker.

### Android
**Local storage choice:**
- MVP: **Room** database.
- Store appMode in `DataStore` (Jetpack DataStore Preferences).

Tasks:
1) Add onboarding fork: `Continue locally`.
2) Implement `LocalDataStore` with Room entities.
3) Gate community UI.
4) Migration:
   - After sign-in, export local payload and upload to backend.
5) Import/export:
   - Export JSON using Storage Access Framework.
   - Import via document picker.

---

## Backend / Convex implications (synced mode)
Even though local-only avoids backend, migration requires a server-side ingestion path.

Recommended approach:
- Add a **single “import payload” mutation** (or HTTP endpoint) that:
  - Authenticates user
  - Validates payload schema/version
  - Inserts challenges/checkins with provided IDs (or maps IDs and returns mapping)
  - Enforces ownership

Keep it idempotent if possible (e.g., upsert by ID) to allow retry.

---

## Rollout strategy (phased)

### Phase 0 — Spec + schema
- Define canonical export/import JSON schema + versioning.
- Define minimal domain entities required for full functionality.

### Phase 1 — Web local-only MVP
- Web is fastest iteration environment.
- Ship local-only mode, gating, import/export, migration to new account.

### Phase 2 — iOS local-only MVP
- Implement local store + mode UI + import/export.
- Add migration call to backend import.

### Phase 3 — Android local-only MVP
- Implement local store + mode UI + import/export.
- Add migration call to backend import.

### Phase 4 — Cross-platform parity + polish
- Unified copy and UX.
- Add “existing account” migration choice UX.
- Add optional local-only safety features:
  - “Back up your local data” prompt
  - “This device only” warning before uninstall risk

---

## Acceptance criteria

### Local-only
- User can complete the full core workflow (create challenges, track progress) without an account.
- Data persists across app restarts.
- Community boards are inaccessible and clearly explained.
- No sync occurs; no backend calls are required for core usage.
- Import/export works and round-trips without loss.

### Upgrade to synced
- User can create/sign-in and migrate existing local-only data.
- After migration, data appears in synced account on the same device.
- Mode indicator updates and community becomes available.

---

## Risks / edge cases
- **Data loss**: local-only users can lose data if uninstalling; mitigate via gentle backup prompts + export.
- **Schema drift** across platforms: mitigate via shared schema definitions and versioning.
- **ID collisions**: UUIDs make this extremely unlikely.
- **Partial migration**: must be resumable or fail fast with clear recovery steps.

---

## Suggested next step (implementation order)
1) Confirm the canonical export/import schema (fields + version).
2) Implement Web `LocalDataStore` + onboarding + mode badge.
3) Add backend import endpoint/mutation.
4) Add Web migration UX.
5) Port the same store contract and migration flow to iOS + Android.
