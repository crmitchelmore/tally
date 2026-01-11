# Consultant Projects TODO

## Completed ✅ (11 of 18 projects)

| Project | PR | What Was Done |
|---------|-----|---------------|
| 01-repo-hygiene | [#16](https://github.com/crmitchelmore/tally/pull/16) | Lockfile guards, workspace docs |
| 02-package-management | [#16](https://github.com/crmitchelmore/tally/pull/16) | Tool versions, policy docs |
| 07-testing-strategy | [#21](https://github.com/crmitchelmore/tally/pull/21) | Test pyramid, integration patterns |
| 08-observability-and-ops | [#22](https://github.com/crmitchelmore/tally/pull/22) | Sentry release tracking |
| 09-security-and-compliance | [#20](https://github.com/crmitchelmore/tally/pull/20) | Security headers, secrets inventory |
| 12-mobile-platform | [#25](https://github.com/crmitchelmore/tally/pull/25) | iOS/Android Sentry, PostHog, docs |
| 13-product-analytics | [#25](https://github.com/crmitchelmore/tally/pull/25) | Event taxonomy, analytics clients |
| 14-legacy-and-tech-debt | [#17](https://github.com/crmitchelmore/tally/pull/17) | Legacy containment, import rules |
| 16-finops | Deleted | Not needed |
| 18-incident-response | [#19](https://github.com/crmitchelmore/tally/pull/19) | 5 runbooks created |

---

## Remaining Work (7 projects)

### Priority 1: High Impact

#### Project 03 - CI/CD Improvements
- [ ] Make affected detection strict (fail on error instead of silent)
- [ ] Add required secrets presence check per job
- [ ] Document deploy ordering (infra → convex → vercel)

#### Project 05 - Auth & Identity
- [ ] Add Convex authz regression tests (using convex-test)
- [ ] Add audit logging for privileged mutations (delete/archive)
- [ ] Document multi-env Clerk key mapping

### Priority 2: Medium Impact

#### Project 04 - IaC Quality
- [ ] Replace Clerk `command.local` with typed dynamic provider
- [ ] Add Pulumi drift detection to CI
- [ ] Document stack recovery procedures

#### Project 06 - API Contracts
- [ ] Define Zod schemas in `packages/shared-types`
- [ ] Implement HTTP actions for mobile
- [ ] Add API versioning (v1 prefix)

#### Project 10 - Performance
- [ ] Add bundle size limits to CI
- [ ] Add Lighthouse metrics (non-blocking)
- [ ] Review unbounded Convex subscriptions

#### Project 11 - Design System
- [ ] Token audit and naming conventions
- [ ] Document 10 core components
- [ ] Add a11y automated checks

### Priority 3: Deferred

#### Project 17 - Privacy (Needs Compliance Review)
- [ ] Data classification schema
- [ ] PII redaction in analytics
- [ ] Account deletion flow

---

## Suggested Next Steps

1. **Merge pending PRs** (#16-25)
2. **Project 05** - Add Convex authz tests (high ROI for security)
3. **Project 03** - Harden CI (fail-fast on errors)
4. **Project 06** - API contracts with Zod (unblocks mobile work)
