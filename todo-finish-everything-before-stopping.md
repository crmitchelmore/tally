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

## Phase 1: Web Local-Only MVP ✅ INFRASTRUCTURE COMPLETE

### 1.1 LocalDataStore Implementation ✅

- [x] **1.1.1 Create IndexedDB wrapper**
  - [x] Install `idb` package
  - [x] Create `tally-web/src/lib/local-storage/db.ts`
  - [x] Define IndexedDB schema: `challenges`, `entries`, `settings`

- [x] **1.1.2 Implement LocalDataStore class**
  - [x] Create `tally-web/src/lib/local-storage/local-data-store.ts`
  - [x] Implement all CRUD operations
  - [x] Implement `exportAll()` and `importAll()`
  - [ ] Add TypeScript types matching the contract

- [ ] **1.1.3 Create mode persistence**
  - [ ] Create `tally-web/src/lib/local-storage/mode.ts`
  - [ ] Store `appMode` in localStorage (small metadata)
  - [ ] Create `useAppMode()` hook
  - [ ] Create `setAppMode()` function
  - [ ] Handle SSR (check `typeof window`)

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

### 1.3 Feature Gating ✅ COMPONENTS CREATED

- [x] **1.3.1 Create useDataStore hook**
  - [x] Created `tally-web/src/hooks/use-data-store.ts`
  - [x] Returns LocalDataStore methods in local-only mode
  - [x] Returns Convex queries/mutations in synced mode
  - [ ] ⏳ App page needs refactoring to USE this hook (see 1.7)

- [x] **1.3.2 Gate community features**
  - [x] Created `<RequiresAccount>` wrapper component
  - [x] Created `<RequiresCommunityAccess>` variant
  - [ ] ⏳ Need to wire into community/leaderboard views

- [ ] **1.3.3 Hide/disable sync indicators**
  - [ ] ⏳ Needs integration into app UI

### 1.4 Mode Indicator UI ✅

- [x] **1.4.1 Add header badge**
  - [x] Created `<ModeIndicator>` component
  - [x] Shows "Local-only" badge when in that mode
  - [x] Includes "Upgrade to sync" button/link

- [x] **1.4.2 Created LocalOnlyBanner**
  - [x] For settings page or prominent display
  - [ ] ⏳ Need to wire into settings/header

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

### 1.6 Import/Export Updates

- [ ] **1.6.1 Update export to use active store**
  - [ ] ⏳ ExportImportDialog already works, just needs parent to pass correct data
  - [ ] Needs app page refactoring

- [ ] **1.6.2 Update import to use active store**
  - [ ] ⏳ Same as above

### 1.7 App Page Integration (CRITICAL REMAINING WORK)

The app page (`/app/page.tsx`) currently uses Convex directly. For local-only mode to work end-to-end, it needs refactoring to:

- [ ] **1.7.1 Refactor app page to use useDataStore**
  - [ ] Replace direct Convex hooks with useDataStore
  - [ ] Handle loading states for both modes
  - [ ] Update challenge CRUD operations
  - [ ] Update entry CRUD operations

- [ ] **1.7.2 Add mode indicator to header**
  - [ ] Show ModeIndicator in app header
  - [ ] Show LocalOnlyBanner if appropriate

- [ ] **1.7.3 Wire RequiresAccount to community views**
  - [ ] Wrap LeaderboardView with RequiresAccount
  - [ ] Wrap PublicChallengesView with RequiresCommunityAccess

- [ ] **1.7.4 Trigger migration dialog**
  - [ ] After successful sign-in, check for local data
  - [ ] Show MigrationDialog if data exists

### 1.8 Testing & Verification (CONTINUE TO COMPLETION)

- [ ] **1.8.1 Manual testing**
  - [ ] Complete full workflow in local-only mode
  - [ ] Create challenge, add entries, view stats
  - [ ] Export data, clear, re-import
  - [ ] Data persists across page refresh
  - [ ] Data persists across browser restart

- [ ] **1.8.2 Migration testing**
  - [ ] Test migration to new account
  - [ ] Verify data appears in Convex dashboard
  - [ ] Verify app works in synced mode after

- [ ] **1.7.3 Build verification**
  - [ ] `bun run build` passes
  - [ ] `bun run lint` passes
  - [ ] No TypeScript errors

> **CONTINUE TO COMPLETION** - Web MVP must be fully functional before moving to mobile.

---

## Phase 2: iOS Local-Only MVP (CONTINUE TO COMPLETION)

- [ ] **2.1 Create LocalDataStore (Swift)**
  - [ ] Choose persistence: SQLite via GRDB or Core Data
  - [ ] Define Swift models matching schema
  - [ ] Implement CRUD operations
  - [ ] Store appMode in UserDefaults

- [ ] **2.2 Onboarding fork**
  - [ ] Add "Continue locally" option to login screen
  - [ ] Wire to set mode and proceed to main app

- [ ] **2.3 Feature gating**
  - [ ] Gate community features
  - [ ] Add mode indicator in UI

- [ ] **2.4 Migration flow**
  - [ ] Export local → call backend import endpoint
  - [ ] Handle success/failure

- [ ] **2.5 Import/Export**
  - [ ] Export via share sheet
  - [ ] Import via Files picker

- [ ] **2.6 Build verification**
  - [ ] Project builds without errors
  - [ ] Test on simulator

> **CONTINUE TO COMPLETION** - iOS must work end-to-end.

---

## Phase 3: Android Local-Only MVP (CONTINUE TO COMPLETION)

- [ ] **3.1 Create LocalDataStore (Kotlin)**
  - [ ] Implement Room entities and DAOs
  - [ ] Store appMode in DataStore Preferences

- [ ] **3.2 Onboarding fork**
  - [ ] Add "Continue locally" option
  - [ ] Wire to set mode

- [ ] **3.3 Feature gating**
  - [ ] Gate community features
  - [ ] Add mode indicator

- [ ] **3.4 Migration flow**
  - [ ] Export local → call backend import
  - [ ] Handle results

- [ ] **3.5 Import/Export**
  - [ ] Export via Storage Access Framework
  - [ ] Import via document picker

- [ ] **3.6 Build verification**
  - [ ] Gradle build passes
  - [ ] Test on emulator

> **CONTINUE TO COMPLETION** - Android must work end-to-end.

---

## Phase 4: Polish & Cross-Platform Parity (CONTINUE TO COMPLETION)

- [ ] **4.1 Unified copy review**
  - [ ] Ensure all mode-related copy is consistent
  - [ ] Review CTA wording across platforms

- [ ] **4.2 Edge case handling**
  - [ ] "Back up your local data" prompt before uninstall (mobile)
  - [ ] Handle sign-out from synced mode gracefully

- [ ] **4.3 Documentation**
  - [ ] Update user-facing docs
  - [ ] Update developer docs
  - [ ] Add to CONTEXT.md

- [ ] **4.4 Final verification**
  - [ ] All platforms build
  - [ ] All platforms pass manual testing
  - [ ] Migration works on all platforms

---

## Acceptance Criteria Verification

Before marking complete, verify:

- [ ] User can complete full core workflow without account (all platforms)
- [ ] Data persists across app restarts (all platforms)
- [ ] Community boards are inaccessible with clear explanation
- [ ] No backend calls in local-only mode (except migration)
- [ ] Import/export round-trips without data loss
- [ ] Upgrade to synced works (new account auto-migrate)
- [ ] Mode indicator visible and accurate
- [ ] Community unlocks after account creation

---

> ⚠️ **FINAL REMINDER**: CONTINUE TO COMPLETION. Every unchecked box is work remaining. Do not stop until this file shows 100% completion. If blocked, document the blocker and move to the next item. Return to blocked items. **FINISH THE WORK.**
