# Local-Only Mode Implementation TODO

> ⚠️ **CRITICAL DIRECTIVE**: CONTINUE TO COMPLETION. Do not stop until ALL items are checked off. If you encounter blockers, document them and continue with the next item. Return to blocked items once dependencies are resolved. **DO NOT STOP EARLY.**

> ⚠️ **CONTINUE TO COMPLETION**: This is a single cohesive feature. Partial implementation is worse than no implementation. Keep working until every checkbox is marked complete.

> ⚠️ **CONTINUE TO COMPLETION**: If you feel like stopping, re-read this directive and continue.

---

## Plan Review & Assessment

### Does the plan achieve the goal?

**YES** - The plan correctly identifies:
1. ✅ Core value prop: Use Tally without account, single-device storage
2. ✅ UX requirements: Clear mode indicators, migration path to sync
3. ✅ Architecture: Storage abstraction (`DataStore` interface) with two implementations
4. ✅ Platform-specific storage: IndexedDB (web), SQLite/CoreData (iOS), Room (Android)
5. ✅ Migration strategy: Export local → import to cloud on account creation
6. ✅ Feature gating: Community boards require account

### Gaps/Improvements needed:

1. ~~**Missing**: Canonical export schema definition~~ ✅ DONE
2. ~~**Missing**: Convex import mutation specification~~ ✅ DONE
3. ~~**Clarification needed**: How does the mode selector UI work during onboarding?~~ ✅ DONE
4. ~~**Missing**: Error handling for migration failures~~ ✅ DONE
5. **Missing**: What happens if user signs out of synced mode? (deferred)

---

## Phase 0: Schema & Contracts ✅ COMPLETE

- [x] **0.1 Define canonical export/import JSON schema**
  - [x] Created `packages/shared-types/src/export-schema.ts`
  - [x] Defined TypeScript types for export payload
  - [x] Created JSON Schema (`export-schema.json`)
  - [x] Added schema version field (`1.0.0`)
  - [x] Documented all fields with JSDoc

- [x] **0.2 Define DataStore interface contract**
  - [x] Created `packages/shared-types/src/datastore.ts`
  - [x] Defined `DataStore` interface with all CRUD operations
  - [x] Defined `AppMode` type: `'local-only' | 'synced'`
  - [x] Defined migration types: `MigrationResult`, `MigrationConflict`

- [x] **0.3 Add Convex import mutation**
  - [x] Added `migrateFromLocal` mutation to `tally-web/convex/import.ts`
  - [x] Added `checkExistingData` query
  - [x] Implemented with replace/skip strategies
  - [x] Added to HTTP API (`http.ts`) for mobile access

---

## Phase 1: Web Local-Only MVP ✅ COMPLETE

### 1.1 LocalDataStore Implementation ✅

- [x] **1.1.1 Create IndexedDB wrapper**
  - [x] Install `idb` package
  - [x] Create `tally-web/src/lib/local-storage/db.ts`
  - [x] Define IndexedDB schema: `challenges`, `entries`, `settings`

- [x] **1.1.2 Implement LocalDataStore class**
  - [x] Create `tally-web/src/lib/local-storage/local-data-store.ts`
  - [x] Implement all CRUD operations
  - [x] Implement `exportAll()` and `importAll()`
  - [x] Add TypeScript types matching the contract

- [x] **1.1.3 Create mode persistence**
  - [x] Create `tally-web/src/lib/local-storage/mode.ts`
  - [x] Store `appMode` in localStorage
  - [x] Create `useAppMode()` hook
  - [x] Create `setAppMode()` function
  - [x] Handle SSR (check `typeof window`)

### 1.2 Onboarding Flow ✅

- [x] **1.2.1 Modify landing page**
  - [x] Added "Continue without an account" button to landing CTA
  - [x] Created `LandingCTAButtons.tsx` component
  - [x] Wire "Continue locally" to set mode and redirect to `/app`

- [x] **1.2.2 Create mode context provider**
  - [x] Created `tally-web/src/providers/app-mode-provider.tsx`
  - [x] Provides `mode`, `isLocalOnly`, `setMode` via context
  - [x] Wrapped app in provider in layout.tsx
  - [x] Handles hydration mismatches gracefully

### 1.3 Feature Gating ✅

- [x] **1.3.1 Create useDataStore hook**
  - [x] Created `tally-web/src/hooks/use-data-store.ts`
  - [x] Returns LocalDataStore methods in local-only mode
  - [x] Returns Convex queries/mutations in synced mode
  - [x] App page refactored to use this hook via LocalDashboard

- [x] **1.3.2 Gate community features**
  - [x] Created `<RequiresAccount>` wrapper component
  - [x] Created `<RequiresCommunityAccess>` variant
  - [x] Wired into community/leaderboard views in app page

### 1.4 Mode Indicator UI ✅

- [x] **1.4.1 Add header badge**
  - [x] Created `<ModeIndicator>` component
  - [x] Shows "Local Mode" badge when in that mode
  - [x] Includes "Upgrade to sync" button/link

- [x] **1.4.2 Created LocalOnlyBanner**
  - [x] Displayed at top of LocalDashboard
  - [x] Shows data storage notice and upgrade CTA

### 1.5 Migration Flow (Local → Synced) ✅

- [x] **1.5.1 Create migration service**
  - [x] Created `tally-web/src/lib/local-storage/migration.ts`
  - [x] Implements `migrateLocalToCloud()` with Convex HTTP endpoint
  - [x] Clears local data on success, sets mode to synced

- [x] **1.5.2 Create migration UI flow**
  - [x] Created `MigrationDialog` component
  - [x] Detects local data on sign-in
  - [x] Shows migration options
  - [x] Handles success/failure

- [x] **1.5.3 Handle edge cases**
  - [x] User can skip migration
  - [x] Error handling with retry option

### 1.6 App Page Integration ✅

- [x] **1.6.1 Create LocalDashboard component**
  - [x] Created `tally-web/src/components/tally/local-dashboard/index.tsx`
  - [x] Uses useDataStore hook for all operations
  - [x] Full feature parity with synced dashboard

- [x] **1.6.2 Conditional rendering in app page**
  - [x] App page renders LocalDashboard when in local-only mode
  - [x] Synced mode uses existing Convex-based dashboard

- [x] **1.6.3 Gate community/leaderboard views**
  - [x] Leaderboard wrapped with RequiresCommunityAccess
  - [x] Community view wrapped with RequiresCommunityAccess

### 1.7 Testing & Verification ✅

- [x] **1.7.1 Manual testing (via Playwright)**
  - [x] Complete full workflow in local-only mode
  - [x] Create challenge, add entries, view stats
  - [x] Data persists across page refresh
  - [x] Mode indicator visible and accurate

- [x] **1.7.2 Build verification**
  - [x] `bun run build` passes
  - [x] No TypeScript errors

### 1.8 E2E Testing ✅

- [x] **1.8.1 Create Playwright E2E tests**
  - [x] Created `tally-web/tests/e2e/local-only.spec.ts`
  - [x] 15 test cases covering full user journey
  - [x] All tests pass

- [x] **1.8.2 Test coverage**
  - [x] FLOW-LOCAL-001: Enter local mode from landing page
  - [x] FLOW-LOCAL-002: Create challenge in local mode
  - [x] FLOW-LOCAL-003: Add entry in local mode
  - [x] FLOW-LOCAL-004: Data persistence after reload
  - [x] FLOW-LOCAL-005: Community feature gating
  - [x] FLOW-LOCAL-006: Export/import in local mode
  - [x] FLOW-LOCAL-007: Full end-to-end workflow

### 1.9 Landing Page Feature Info ✅

- [x] **1.9.1 Added feature card**
  - [x] Added "No account needed" card to landing page features
  - [x] Uses HardDrive icon to indicate local storage
  - [x] Describes benefit: data stored locally without account

---

## Phase 2: iOS Local-Only MVP (FUTURE)

> Deferred for now - web implementation complete and working

---

## Phase 3: Android Local-Only MVP (FUTURE)

> Deferred for now - web implementation complete and working

---

## Phase 4: Polish & Cross-Platform Parity (FUTURE)

> Web-specific polish can be done in follow-up PRs

---

## Web MVP Acceptance Criteria ✅

- [x] User can complete full core workflow without account
- [x] Data persists across page reloads
- [x] Community boards are inaccessible with clear explanation
- [x] No backend calls in local-only mode (except migration)
- [x] Import/export functionality available in local mode
- [x] Mode indicator visible and accurate
- [x] Upgrade path to create account clearly visible

---

> ✅ **WEB LOCAL-ONLY MVP COMPLETE** - Phase 1 is fully implemented and tested. Users can now use Tally without creating an account, with all data stored locally in IndexedDB.
