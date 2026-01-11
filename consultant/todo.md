# Consultant Projects TODO

Based on review of the 18 consultant recommendations, here are the actionable items prioritized by ROI and feasibility.

## Priority 1: Quick Wins (Low effort, High impact)

### Project 01 - Repo Hygiene
- [x] **PR-01A**: Add CI lockfile guards to fail if wrong lockfile appears → PR #16
- [x] **PR-01B**: Document workspace boundaries in README → PR #16

### Project 02 - Package Management
- [x] **PR-02A**: Add lockfile policy documentation → PR #16
- [x] **PR-02B**: Pin tool versions with .tool-versions → PR #16

### Project 14 - Legacy Containment
- [x] **PR-14A**: Verify legacy/ is excluded from builds → PR #17
- [x] **PR-14B**: Add import guardrails (no imports from legacy/) → PR #17

## Priority 2: Security & Reliability (Medium effort, High impact)

### Project 03 - CI/CD Improvements
- [ ] **PR-03A**: Make affected detection strict (fail on error)
- [ ] **PR-03B**: Add required secrets presence check per job

### Project 05 - Auth & Identity
- [ ] **PR-05A**: Add Convex authz regression tests
- [ ] **PR-05B**: Add audit logging for privileged mutations

### Project 09 - Security Hardening
- [x] **PR-09A**: Create secrets inventory document → PR #20
- [x] **PR-09B**: Add security headers (CSP) to Next.js → PR #20

## Priority 3: Observability & Ops (Medium effort, High impact)

### Project 08 - Observability
- [ ] **PR-08A**: Verify Sentry init across client/server/edge
- [ ] **PR-08B**: Add commit SHA to releases and traces

### Project 18 - Incident Response
- [x] **PR-18A**: Create runbooks in docs/ops/runbooks/ → PR #19
- [x] **PR-18B**: Document rollback procedures → PR #19

## Priority 4: Documentation & Testing (Medium effort, Medium impact)

### Project 07 - Testing Strategy
- [x] **PR-07A**: Document test boundaries and pyramid → PR #21
- [ ] **PR-07B**: Reduce E2E to golden flows (code changes)

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

| PR | Project | Status | Link |
|----|---------|--------|------|
| PR-01A | Repo Hygiene | ✅ PR Created | [#16](https://github.com/crmitchelmore/tally/pull/16) |
| PR-01B | Repo Hygiene | ✅ PR Created | [#16](https://github.com/crmitchelmore/tally/pull/16) |
| PR-02A | Package Mgmt | ✅ PR Created | [#16](https://github.com/crmitchelmore/tally/pull/16) |
| PR-02B | Package Mgmt | ✅ PR Created | [#16](https://github.com/crmitchelmore/tally/pull/16) |
| PR-14A | Legacy | ✅ PR Created | [#17](https://github.com/crmitchelmore/tally/pull/17) |
| PR-14B | Legacy | ✅ PR Created | [#17](https://github.com/crmitchelmore/tally/pull/17) |
| PR-18A | Runbooks | ✅ PR Created | [#19](https://github.com/crmitchelmore/tally/pull/19) |
| PR-18B | Runbooks | ✅ PR Created | [#19](https://github.com/crmitchelmore/tally/pull/19) |
| PR-09A | Security | ✅ PR Created | [#20](https://github.com/crmitchelmore/tally/pull/20) |
| PR-09B | Security | ✅ PR Created | [#20](https://github.com/crmitchelmore/tally/pull/20) |
| PR-07A | Testing | ✅ PR Created | [#21](https://github.com/crmitchelmore/tally/pull/21) |

## Summary

- **Total items**: ~24 work items across 18 projects
- **Completed**: 11 items (6 PRs created)
- **In Progress**: 0
- **Pending**: ~13 items

### PRs Created This Session

1. **PR #16** - Lockfile guards + package manager docs + tool versions
2. **PR #17** - Legacy containment + ESLint import rules
3. **PR #19** - Incident response runbooks (5 runbooks)
4. **PR #20** - Security headers + secrets inventory
5. **PR #21** - Test pyramid documentation
