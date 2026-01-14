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

1. **Missing**: Canonical export schema definition (mentioned but not specified)
2. **Missing**: Convex import mutation specification
3. **Clarification needed**: How does the mode selector UI work during onboarding?
4. **Missing**: Error handling for migration failures
5. **Missing**: What happens if user signs out of synced mode?

---

## Phase 0: Schema & Contracts (CONTINUE TO COMPLETION)

- [ ] **0.1 Define canonical export/import JSON schema**
  - [ ] Create `packages/tally-export-schema/` package
  - [ ] Define TypeScript types for export payload
  - [ ] Define JSON Schema for validation
  - [ ] Add schema version field (start at `1.0.0`)
  - [ ] Document all fields with JSDoc
  - [ ] Export from package for all platforms to consume

- [ ] **0.2 Define DataStore interface contract**
  - [ ] Create `packages/datastore-contract/` (or add to shared-types)
  - [ ] Define `DataStore` interface with all CRUD operations
  - [ ] Define `AppMode` type: `'local-only' | 'synced'`
  - [ ] Define migration types: `MigrationResult`, `MigrationConflict`
  - [ ] Export for all platforms

- [ ] **0.3 Add Convex import mutation**
  - [ ] Create `tally-web/convex/migrations.ts`
  - [ ] Implement `importPayload` mutation (authenticated)
  - [ ] Validate payload against schema
  - [ ] Upsert challenges with provided UUIDs
  - [ ] Upsert entries with provided UUIDs
  - [ ] Return success/failure with ID mappings
  - [ ] Add to HTTP API (`http.ts`) for mobile access
  - [ ] Test mutation manually

> **CONTINUE TO COMPLETION** - Phase 0 defines the contract. All subsequent work depends on this.

---

## Phase 1: Web Local-Only MVP (CONTINUE TO COMPLETION)

### 1.1 LocalDataStore Implementation

- [ ] **1.1.1 Create IndexedDB wrapper**
  - [ ] Install `idb` package: `cd tally-web && bun add idb`
  - [ ] Create `tally-web/src/lib/local-storage/db.ts`
  - [ ] Define IndexedDB schema: `challenges`, `entries`, `settings`
  - [ ] Implement database initialization with versioning
  - [ ] Handle upgrade migrations for schema changes

- [ ] **1.1.2 Implement LocalDataStore class**
  - [ ] Create `tally-web/src/lib/local-storage/local-data-store.ts`
  - [ ] Implement `getChallenges()` / `putChallenge()` / `deleteChallenge()`
  - [ ] Implement `getEntries(challengeId)` / `putEntry()` / `deleteEntry()`
  - [ ] Implement `export()` → returns canonical JSON
  - [ ] Implement `import(payload)` → validates and inserts
  - [ ] Add TypeScript types matching the contract

- [ ] **1.1.3 Create mode persistence**
  - [ ] Create `tally-web/src/lib/local-storage/mode.ts`
  - [ ] Store `appMode` in localStorage (small metadata)
  - [ ] Create `useAppMode()` hook
  - [ ] Create `setAppMode()` function
  - [ ] Handle SSR (check `typeof window`)

### 1.2 Onboarding Flow

- [ ] **1.2.1 Modify landing page**
  - [ ] Update `/` or `/sign-in` to show two options:
    - "Continue locally (no account)"
    - "Sign in / Create account"
  - [ ] Wire "Continue locally" to set mode and redirect to `/app`
  - [ ] Ensure existing sign-in flow still works

- [ ] **1.2.2 Create mode context provider**
  - [ ] Create `tally-web/src/providers/app-mode-provider.tsx`
  - [ ] Provide `mode`, `isLocalOnly`, `setMode` via context
  - [ ] Wrap app in provider (before or alongside Clerk)
  - [ ] Handle hydration mismatches gracefully

### 1.3 Feature Gating

- [ ] **1.3.1 Gate Convex calls in local-only mode**
  - [ ] Create `useDataStore()` hook that returns either:
    - Convex queries/mutations (synced mode)
    - LocalDataStore methods (local-only mode)
  - [ ] Update challenge list to use `useDataStore()`
  - [ ] Update challenge detail to use `useDataStore()`
  - [ ] Update entry management to use `useDataStore()`

- [ ] **1.3.2 Gate community features**
  - [ ] Create `<RequiresAccount>` wrapper component
  - [ ] Wrap community browse page
  - [ ] Wrap leaderboard page (if requires account)
  - [ ] Show friendly "Create account to access community" message
  - [ ] Add "Create account" CTA button

- [ ] **1.3.3 Hide/disable sync indicators**
  - [ ] Identify all sync-related UI elements
  - [ ] Conditionally hide in local-only mode
  - [ ] Remove real-time subscription hooks in local-only mode

### 1.4 Mode Indicator UI

- [ ] **1.4.1 Add header badge**
  - [ ] Create `<ModeIndicator>` component
  - [ ] Show "Local-only" badge when in that mode
  - [ ] Add "Upgrade to sync" button/link
  - [ ] Style to be calm but visible

- [ ] **1.4.2 Add settings page section**
  - [ ] Add "Data Mode" section to settings
  - [ ] Show current mode: "Local-only" or "Synced"
  - [ ] Show "Upgrade to sync" CTA for local-only
  - [ ] Show explanatory text

### 1.5 Migration Flow (Local → Synced)

- [ ] **1.5.1 Create migration service**
  - [ ] Create `tally-web/src/lib/local-storage/migration.ts`
  - [ ] Implement `migrateLocalToCloud(userId)`:
    - Export all local data
    - Call Convex import mutation
    - On success: clear local data, set mode to synced
    - On failure: rollback, show error

- [ ] **1.5.2 Create migration UI flow**
  - [ ] After sign-up/sign-in, detect local data exists
  - [ ] Show migration options:
    - New account: "Migrate your local data?" (yes/no)
    - Existing account: Show conflict choices
  - [ ] Run migration on confirmation
  - [ ] Show success/failure message
  - [ ] Redirect to app in synced mode

- [ ] **1.5.3 Handle edge cases**
  - [ ] User cancels migration → stays in local-only? or synced without local data?
  - [ ] Migration fails midway → retry mechanism
  - [ ] Network error during migration → queue for retry

### 1.6 Import/Export Updates

- [ ] **1.6.1 Update export to use active store**
  - [ ] Modify export logic to check current mode
  - [ ] Use LocalDataStore.export() in local-only
  - [ ] Use Convex export in synced mode
  - [ ] Ensure same output format

- [ ] **1.6.2 Update import to use active store**
  - [ ] Modify import logic to check current mode
  - [ ] Use LocalDataStore.import() in local-only
  - [ ] Use Convex import in synced mode
  - [ ] Validate schema version before import

### 1.7 Testing & Verification (CONTINUE TO COMPLETION)

- [ ] **1.7.1 Manual testing**
  - [ ] Complete full workflow in local-only mode
  - [ ] Create challenge, add entries, view stats
  - [ ] Export data, clear, re-import
  - [ ] Data persists across page refresh
  - [ ] Data persists across browser restart

- [ ] **1.7.2 Migration testing**
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
