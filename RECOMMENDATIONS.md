# Master Recommendations Report

## 1. Repository Standards (Priority: High)
- [ ] **Add `CONTRIBUTING.md`**: The repository lacks a contribution guide.
- [ ] **Add Pull Request Template**: Ensure standardized PR descriptions.
- [ ] **Add Issue Templates**: Standardize bug reports and feature requests.

## 2. CI/CD Improvements (Project 03) (Priority: High)
- [ ] **Strict Failure Mode**: Configure `nx affected` to fail on error.
- [ ] **Secret Presence Checks**: Add steps to verify required secrets exist before running tests/builds.
- [ ] **Deployment Ordering Docs**: Document the infra -> convex -> vercel dependency.

## 3. Auth & Identity (Project 05) (Priority: High)
- [ ] **Convex Authz Tests**: Add regression tests for authorization rules using `convex-test`.
- [ ] **Audit Logging**: Implement logging for privileged mutations.

## 4. Infrastructure Quality (Project 04) (Priority: Medium)
- [ ] **Typed Pulumi Providers**: Replace `command.local` with proper providers where possible.
- [ ] **Drift Detection**: Add a CI job to check for infrastructure drift.

## 5. API Contracts (Project 06) (Priority: Medium)
- [ ] **Zod Schemas**: Centralize schemas in `packages/shared-types`.
- [ ] **Mobile API**: Implement specific HTTP actions for mobile clients.

## 6. Performance (Project 10) (Priority: Medium)
- [ ] **Bundle Size Budget**: Add checks to CI.
- [ ] **Lighthouse CI**: Add non-blocking performance audits.

## 7. Design System (Project 11) (Priority: Medium)
- [ ] **Token Audit**: Review design tokens for consistency.
- [ ] **A11y Checks**: Add automated accessibility testing.

## 8. Privacy (Project 17) (Priority: Low)
- [ ] **Data Classification**: Define schema for data sensitivity.
