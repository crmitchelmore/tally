# Consultant Projects TODO

## Completed ✅

| Project | PR | What Was Done |
|---------|-----|---------------|
| 01-repo-hygiene | [#16](https://github.com/crmitchelmore/tally/pull/16) | Lockfile guards, workspace docs |
| 02-package-management | [#16](https://github.com/crmitchelmore/tally/pull/16) | Tool versions, policy docs |
| 07-testing-strategy | [#21](https://github.com/crmitchelmore/tally/pull/21) | Test pyramid, integration patterns |
| 08-observability-and-ops | [#22](https://github.com/crmitchelmore/tally/pull/22) | Sentry release tracking |
| 09-security-and-compliance | [#20](https://github.com/crmitchelmore/tally/pull/20) | Security headers, secrets inventory |
| 14-legacy-and-tech-debt | [#17](https://github.com/crmitchelmore/tally/pull/17) | Legacy containment, import rules |
| 18-incident-response | [#19](https://github.com/crmitchelmore/tally/pull/19) | 5 runbooks created |

---

## Remaining Work

### Priority 1: High Impact (Next Up)

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

### Priority 3: Deferred (Needs External Input)

#### Project 12 - Mobile (Separate Track)
- [ ] iOS app shell + auth
- [ ] Android app shell + auth
- [ ] Shared API contracts

#### Project 13 - Analytics (Needs Product)
- [ ] Define event taxonomy
- [ ] Flag governance policy
- [ ] Experiment templates

#### Project 16 - FinOps (Needs Data)
- [ ] Identify top cost drivers
- [ ] Set up budget alerts
- [ ] Track unit economics

#### Project 17 - Privacy (Needs Compliance)
- [ ] Data classification schema
- [ ] PII redaction in analytics
- [ ] Account deletion flow

---

## Suggested Next Steps

1. **Merge pending PRs** (#16-22)
2. **Project 05** - Add Convex authz tests (high ROI for security)
3. **Project 03** - Harden CI (fail-fast on errors)
4. **Project 06** - API contracts (unblocks mobile work)
