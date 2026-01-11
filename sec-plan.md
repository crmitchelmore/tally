# Security Plan (OSS-friendly)

> Assumption: **breach is inevitable**. This plan focuses on minimizing blast radius, preventing secret leakage, and catching vulnerabilities early with **free tooling** suitable for a public/open-source repo.

## 0) Current posture (as of 2026-01-11)

### Enabled (GitHub-native)
- **Secret scanning**: enabled
- **Secret scanning push protection**: enabled
- **Dependabot security updates**: enabled

### Gaps / observations
- **Code scanning (CodeQL)**: not running (no analyses configured).
- **Known vulnerability**: 1 open Dependabot alert (`qs`, patched in `>= 6.14.1`).
- **Secrets exposure risk**: LaunchDarkly keys were present in `docs/LAUNCHDARKLY.md` and have been redacted, but **they were exposed in git history**, so treat them as compromised.
- No `.github/workflows/` found (CI likely not enforcing security checks on PRs).
- `SECURITY.md` is a generic template and doesn’t describe how to report issues for this project.

---

## 1) Findings (severity, risk, controls)

### HIGH — LaunchDarkly keys were committed (info disclosure)
- **Likelihood**: High (public repo + history)
- **Impact**: High (flags could be read/modified; potential service abuse)
- **Current controls**: secret scanning enabled; docs now redacted
- **Fix**:
  1) **Rotate LaunchDarkly admin token + SDK/mobile keys immediately**.
  2) Consider rewriting git history (optional, see §2.2) if you must remove historical exposure.
- **Verification**:
  - Confirm old keys are revoked in LaunchDarkly.
  - Confirm GitHub secret scanning shows **0 open alerts**.

### HIGH — Dependency vulnerability: `qs` (< 6.14.1)
- **Likelihood**: Medium (depends on runtime usage path)
- **Impact**: High (DoS via memory exhaustion)
- **Current controls**: Dependabot alert exists
- **Fix**:
  - Upgrade `qs` to `>= 6.14.1` by updating the lockfile(s) and any direct dependency constraints.
- **Verification**:
  - Dependabot alert closes.
  - `npm audit`/`bun audit` (where applicable) no longer flags it.

### MEDIUM — No code scanning / SAST in CI
- **Likelihood**: Medium
- **Impact**: Medium–High (missed injection/authz bugs)
- **Current controls**: none observed
- **Fix**: Enable **CodeQL** (free for public repos) via GitHub Actions.
- **Verification**:
  - Code scanning shows a recent successful analysis on default branch.

### MEDIUM — Missing supply-chain hygiene automation
- **Likelihood**: Medium
- **Impact**: Medium (slow patching / drift)
- **Current controls**: Dependabot security updates enabled
- **Fix**:
  - Add **Dependabot version updates** (free) for:
    - root (Nx workspace)
    - `tally-web/`
    - `infra/`
  - If Dependabot can’t fully handle `bun.lockb`, add Renovate (free for OSS) to keep Bun deps current.
- **Verification**:
  - Regular dependency PRs are created.

### LOW–MEDIUM — Security policy doesn’t match project
- **Likelihood**: Medium
- **Impact**: Low–Medium (slow/unsafe disclosure)
- **Fix**: Replace `SECURITY.md` with project-specific reporting + expectations.
- **Verification**:
  - `SECURITY.md` clearly states private reporting channel and response SLA.

---

## 2) Controls to implement (priority order)

### 2.1 Immediate (today)
1. **Rotate all exposed tokens/keys**
   - LaunchDarkly: admin token + environment SDK/mobile keys.
   - If any other keys were ever in docs/commits, rotate those too.
2. **Patch `qs`** to `>= 6.14.1` (close Dependabot alert).
3. **Enable CodeQL (SAST)**
   - Add `.github/workflows/codeql.yml` using the official `github/codeql-action`.
   - Targets: JavaScript/TypeScript.
4. **Add PR security gates**
   - Required status checks:
     - CodeQL
     - unit tests (`nx test`)
     - lint (`nx lint`)

### 2.2 Near-term (this week)
1. **Dependabot version updates**
   - Add `.github/dependabot.yml` for npm workspaces.
   - Configure update cadence (weekly) and group related updates.
2. **Secret scanning hardening**
   - Enable:
     - secret scanning validity checks (if available)
     - non-provider patterns (custom patterns) for your tokens (e.g., `CONVEX_DEPLOY_KEY`, `PULUMI_ACCESS_TOKEN`, etc.)
3. **Add a lightweight secret pre-check** (developer + CI)
   - `gitleaks` (free) as a pre-commit hook and as a CI job.
4. **Customize `SECURITY.md`**
   - Private reporting email/contact
   - Supported versions
   - Coordinated disclosure expectations

### 2.3 Medium-term (this month)
1. **SBOM + dependency provenance**
   - Generate SBOM with `syft` (free) in CI for releases.
   - Scan with `grype` or `osv-scanner` (free).
2. **Harden GitHub Actions**
   - Use least-privilege `permissions:` in workflows.
   - Pin actions by SHA where practical.
   - Use environment protection rules for deployment workflows.
3. **Branch protections**
   - Require PR reviews (CODEOWNERS for `infra/`, auth, and deployment).
   - Require signed commits (optional, but recommended).

---

## 3) Threat model (STRIDE, condensed)

### Attack surface
- **Web app** (`tally-web/`): Next.js App Router, API routes, middleware
- **Auth**: Clerk (tokens/cookies/session)
- **Backend**: Convex (queries/mutations, webhooks)
- **Feature flags**: LaunchDarkly SDK + webhook integration
- **Infra**: Pulumi (Cloudflare, Vercel, Clerk config)

### Key threats & mitigations
- **Spoofing**: forged session/user contexts
  - Mitigate with Clerk middleware protections, server-side auth checks in Convex.
- **Tampering**: request payload manipulation / webhook replay
  - Validate inputs with Zod on server boundaries; verify webhook signatures (if supported).
- **Repudiation**: lack of audit trail
  - Add structured logs + request IDs for auth-sensitive actions.
- **Information disclosure**: secrets in repo, logs, client bundles
  - Secret scanning + gitleaks + strict env var boundaries; never log tokens.
- **DoS**: expensive queries / parsing attacks (e.g., `qs`)
  - Patch deps; rate-limit where possible; constrain payload size.
- **Elevation of privilege**: authz bugs (IDOR) in Convex/Next endpoints
  - Centralize authz checks; test with negative cases; CodeQL helps catch common patterns.

---

## 4) Recommended tooling (free / OSS-friendly)

### GitHub-native (free for public repos)
- **CodeQL** (GitHub Actions) — SAST
- **Dependabot** — security + version updates
- **Secret scanning + push protection** — prevent leaks

### Additional free tools that fit this stack
- **gitleaks** — secret detection in pre-commit + CI
- **osv-scanner** — OSS vuln scanning (fast)
- **syft + grype** — SBOM + vuln scanning
- **Renovate** (optional) — best-in-class dependency updates; good with monorepos and Bun

---

## 5) Implementation checklist

### Repo config
- [ ] Branch protection on `main`: required PR, required checks, linear history (optional)
- [ ] CODEOWNERS for `infra/` and auth/security-sensitive areas
- [ ] Minimal GitHub Actions permissions

### CI workflows to add
- [ ] `codeql.yml` (TS/JS)
- [ ] `ci.yml` running `nx lint`, `nx test`, optionally `nx build`
- [ ] `gitleaks.yml` (or run as a step in `ci.yml`)

### Dependency management
- [ ] Close current `qs` alert by upgrading lockfiles
- [ ] `.github/dependabot.yml` for version updates

---

## 6) Verification steps (ongoing)

### Per-PR
- CodeQL passes
- Unit tests + lint pass
- Secret scan / gitleaks passes

### Weekly
- Triage Dependabot alerts (SLA: high within 7 days)
- Review CodeQL findings and mark false positives with justification

### Quarterly
- Rotate high-value tokens
- Review access scopes for Cloudflare/Vercel/Pulumi/Clerk tokens (least privilege)

---

## 7) Notes specific to this repo
- Web uses **Bun** (`tally-web/`), infra uses **npm** (`infra/`). Ensure whichever updater you choose handles both lockfile ecosystems.
- Treat all previously committed tokens as compromised even if they were “just docs.”
