# Consultant Projects TODO

Based on review of the 18 consultant recommendations, here are the actionable items prioritized by ROI and feasibility.

## Priority 1: Quick Wins (Low effort, High impact)

### Project 01 - Repo Hygiene
- [x] **PR-01A**: Add CI lockfile guards to fail if wrong lockfile appears
- [x] **PR-01B**: Document workspace boundaries in README

### Project 02 - Package Management
- [x] **PR-02A**: Add lockfile policy documentation
- [x] **PR-02B**: Pin tool versions with .tool-versions or volta

### Project 14 - Legacy Containment
- [ ] **PR-14A**: Verify legacy/ is excluded from builds
- [ ] **PR-14B**: Add import guardrails (no imports from legacy/)

## Priority 2: Security & Reliability (Medium effort, High impact)

### Project 03 - CI/CD Improvements
- [ ] **PR-03A**: Make affected detection strict (fail on error)
- [ ] **PR-03B**: Add required secrets presence check per job

### Project 05 - Auth & Identity
- [ ] **PR-05A**: Add Convex authz regression tests
- [ ] **PR-05B**: Add audit logging for privileged mutations

### Project 09 - Security Hardening
- [ ] **PR-09A**: Create secrets inventory document
- [ ] **PR-09B**: Add security headers (CSP) to Next.js

## Priority 3: Observability & Ops (Medium effort, High impact)

### Project 08 - Observability
- [ ] **PR-08A**: Verify Sentry init across client/server/edge
- [ ] **PR-08B**: Add commit SHA to releases and traces

### Project 18 - Incident Response
- [ ] **PR-18A**: Create runbooks in docs/ops/runbooks/
- [ ] **PR-18B**: Document rollback procedures

## Priority 4: Documentation & Testing (Medium effort, Medium impact)

### Project 07 - Testing Strategy
- [ ] **PR-07A**: Document test boundaries and pyramid
- [ ] **PR-07B**: Reduce E2E to golden flows

### Project 01 - Docs Consolidation
- [ ] **PR-01C**: Consolidate ops docs under docs/ops/
- [ ] **PR-01D**: Create docs entry point

## Priority 5: Performance & UX (Can be done incrementally)

### Project 10 - Performance
- [ ] **PR-10A**: Add bundle size limits to CI
- [ ] **PR-10B**: Add Lighthouse metrics (non-blocking)

### Project 11 - Design System
- [ ] **PR-11A**: Token audit and naming conventions
- [ ] **PR-11B**: Document 10 core components

## Priority 6: Deferred (Needs product/mobile work)

### Project 06 - API Contracts
- [ ] **PR-06**: Contract-first schema for mobile (deferred until mobile begins)

### Project 12 - Mobile Platform
- [ ] **PR-12**: Mobile foundations (iOS/Android in progress separately)

### Project 04 - IaC Quality
- [ ] **PR-04A**: Replace Clerk shell IaC with typed provider (complex, lower priority)

### Project 13 - Product Analytics
- [ ] **PR-13**: Event taxonomy (product decision needed)

### Project 16 - FinOps
- [ ] **PR-16**: Cost budgets and alerts (needs cost data)

### Project 17 - Privacy
- [ ] **PR-17**: Data classification and retention (needs compliance review)

---

## Progress Tracking

| PR | Project | Status | Branch |
|----|---------|--------|--------|
| PR-01A | Repo Hygiene | 🟡 In Progress | - |
| PR-01B | Repo Hygiene | ⬜ Pending | - |
| PR-02A | Package Mgmt | ⬜ Pending | - |
| PR-02B | Package Mgmt | ⬜ Pending | - |
| PR-14A | Legacy | ⬜ Pending | - |
| PR-14B | Legacy | ⬜ Pending | - |
