# Tally - Copilot Instructions

## Quick Reference

- **Custom Agent**: Use `tally` agent for project-specific assistance
- **Context File**: Read `CONTEXT.md` for full project state
- **Mental Model**: Read `docs/MENTAL-MODEL.md`
- **Design Philosophy**: Read `docs/DESIGN-PHILOSOPHY.md`
- **Domain**: https://tally-tracker.app

## Marketing assets convention

When adding marketing/app store materials:
- Put source art + listing copy in `docs/` (use a single index file that links out).
- Prefer vector sources (SVG) + export instructions over committing large binary icon sets.
- Add a link from the root `README.md` under “Docs”.
- If asked to “document then reflect”, update repo docs first, then provide the reflection.

## Product principles (apply to all changes)

Tally should feel **friendly, fun, and fast**.

When implementing UI/UX (web/iOS/Android), optimize for:
- **Effortless defaults**: minimize setup and decisions; strong defaults.
- **Progressive disclosure**: show essentials first, details on demand.
- **Fast perceived performance**: instant feedback, fewer spinners; prefer skeletons/progressive rendering.
- **Instant sync**: changes should appear quickly across devices; make sync state understandable but calm.
- **Calm + accessible**: high contrast, readable type, sensible motion; respect reduced-motion.
- **Playful (not noisy)**: delight that never reduces clarity.

## Engineering principles (how to build)

Decision order:
1) **User value first**
2) **Modular-first** (feature isolation; avoid cross-cutting churn)
3) **Ship safely** (typed APIs, automated checks, repeatable deploys)
4) **Performance is a feature**
5) **Prefer boring infra, creative UI**

Practical rules:
- Keep domain logic shared where possible (contracts/types) so web/iOS/Android stay consistent.
- Prefer small, surgical changes; avoid unrelated refactors.
- **Never discard unrelated local edits.** If a clean working tree is needed, use `git stash push -u -m "wip: <desc>"` and restore later; only discard changes with explicit user approval.
- If the Copilot CLI `bash` tool errors with `posix_spawnp failed`, retry via the `task` agent as a fallback.
- Add lightweight regression checks when touching critical flows (auth, API, data integrity).

## PR Review Workflow

When reviewing multiple PRs systematically:
- **Check `mergeable` state first** - skip PRs with conflicts, leave a comment explaining the situation
- **Dependabot PRs**: Approve with note that admin merge is required (Dependabot doesn't have access to repo secrets, so CI checks like lint/build will fail)
- **Android CI failures**: Often pre-existing on main (e.g., `FollowedChallenge deserialization`) - verify failure is in PR diff before blocking
- **Label PRs** with `reviewing` when starting work to signal in-progress status
- **Batch fixes**: Address all review comments in a single commit when possible

## Project Overview

Tally is a multi-platform challenge tracking app:
- **Web**: Next.js 16 + Convex + Clerk (in `tally-web/`)
- **iOS**: Coming soon (in `tally-ios/`)
- **Android**: Coming soon (in `tally-android/`)
- **Infrastructure**: Pulumi TypeScript (in `infra/`)

## Critical Rules

### Package Manager
- **Web app (`tally-web/`)**: Use `bun` (NOT npm/yarn)
- **Infrastructure (`infra/`)**: Use `npm`

### Infrastructure
- **NEVER** change infrastructure manually in dashboards
- **ALWAYS** use Pulumi: `cd infra && pulumi up`
- Commit all infra changes to git

### Authentication (Clerk)
- Use `clerkMiddleware()` in `proxy.ts`
- Do NOT use deprecated `authMiddleware()`
- App Router only (no pages router patterns)
- Never hardcode keys - use `.env`

### Deploy/auth guardrails
- Never commit app secrets or local env files (e.g. `tally-web/.env.local`).
- When Clerk shows "Development mode" in prod, verify `pk_live_*` in `/sign-in` HTML and absence of `clerk.accounts.dev`.
- Vercel project `rootDirectory` is `tally-web`; workflows should run from repo root to avoid `tally-web/tally-web`.
- **Web dev deploy is intentionally disabled** (no dedicated `dev.tally-tracker.app`) due to current Vercel plan constraints; use PR previews or local dev. Re-enable via LaunchDarkly flag `enable-web-dev-deploy` or repo variable `ENABLE_DEV_WEB_DEPLOY=true`.

### Mobile Development Setup

**iOS (`tally-ios/`):**
- Generate project: `cd tally-ios && xcodegen generate`
- Create `Debug.xcconfig` (gitignored) with:
  ```
  CLERK_PUBLISHABLE_KEY_DEV = pk_test_...
  ```
- Build: `xcodebuild -project Tally.xcodeproj -scheme Tally -destination 'platform=iOS Simulator,name=iPhone 15 Pro' -configuration Debug build`
- Screenshot: `xcrun simctl io <device-id> screenshot /tmp/screenshot.png`

**Android (`tally-android/`):**
- Create `local.properties` with: `sdk.dir=/Users/<user>/Library/Android/sdk`
- Build with Clerk key: `CLERK_PUBLISHABLE_KEY_DEV=pk_test_... ./gradlew :app:assembleDebug`
- Start emulator: `$ANDROID_HOME/emulator/emulator -avd tally_api35 -no-snapshot-load &`
- Screenshot: `adb exec-out screencap -p > /tmp/screenshot.png`

**Debugging mobile apps:**
- Always take simulator/emulator screenshots to understand UI state
- iOS logs: `xcrun simctl spawn <device-id> log show --predicate 'processImagePath CONTAINS "Tally"' --last 1m`
- Android logs: `adb logcat -d | grep -E "(AndroidRuntime|FATAL|app.tally)"`
- If iOS Simulator stops responding to clicks, restart it: `xcrun simctl shutdown <device-id> && xcrun simctl boot <device-id>`

**App icon generation:**
- Source: `docs/brand-app-icon.svg` (see `docs/MARKETING.md` for specs)
- Use `qlmanage -t -s <size> -o /tmp <svg>` for SVG→PNG (ImageMagick struggles with gradients)
- iOS: single 1024x1024 PNG in `Assets.xcassets/AppIcon.appiconset/`
- Android: mipmap-mdpi (48), hdpi (72), xhdpi (96), xxhdpi (144), xxxhdpi (192)

### CI gotchas (mobile)
- `reactivecircus/android-emulator-runner@v2` does **not** support `adb-timeout`; avoid adding unsupported inputs.
- GitHub Actions job logs may be unavailable until completion (`gh run view --log` and MCP job logs can fail/404 while in progress).
- Prefer a single retry for emulator-based instrumented tests rather than only widening timeouts.

### Mobile SDK initialization gotchas
- **Sentry (Android)**: Add `<meta-data android:name="io.sentry.auto-init" android:value="false" />` to AndroidManifest.xml to prevent crash when DSN is not configured
- **Clerk (iOS)**: Check `clerk.isLoaded` before rendering `AuthView` - Clerk SDK shows blank screen while loading
- **Info.plist (iOS)**: Use explicit `Info.plist` file with `$(BUILD_SETTING)` placeholders instead of `INFOPLIST_KEY_` prefix for build settings that need to be readable at runtime
- **Clerk prod key on mobile**: Production Clerk keys (`pk_live_*`) may fail with error code 1000 on mobile apps due to domain restrictions. Use dev keys (`pk_test_*`) for local development; prod requires Clerk dashboard configuration for mobile origins.

### GitHub Actions Clerk secrets
Workflows may reference secrets with or without environment suffixes. Ensure both exist:
- `CLERK_SECRET_KEY` / `CLERK_SECRET_KEY_PROD` / `CLERK_SECRET_KEY_DEV`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV`
- `CLERK_PUBLISHABLE_KEY` (Android deploy)

Verify with: `gh secret list --repo <owner>/<repo> | grep -i clerk`

### PR merge blockers & resolution
- **Review thread resolution:** Branch protection requires all review threads resolved. After force-pushing a cleaned branch, outdated threads still block merge. Resolve via GraphQL:
  ```bash
  gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "PRRT_..."}) { thread { isResolved } } }'
  ```
- **Stale bot reviews:** CodeRabbit/Copilot CHANGES_REQUESTED reviews don't auto-update after force-push. Dismiss stale reviews:
  ```bash
  gh api -X PUT "repos/OWNER/REPO/pulls/PR/reviews/REVIEW_ID/dismissals" -f message="Addressed in commit X"
  ```
- **Branch protection:** This repo uses GitHub Rulesets (not legacy branch protection). Check via `/rulesets` API, not `/branches/.../protection`.

### Convex Authorization Pattern
- **Never trust client-provided `userId`** in mutations - always derive from `ctx.auth.getUserIdentity()`
- Use centralized auth helpers from `convex/lib/auth.ts`:
  - `requireCurrentUser(ctx)` - get authenticated user or throw
  - `assertChallengeOwner(ctx, id)` - verify ownership before update/delete
  - `canAccessChallenge(ctx, id)` - check read access (owner OR public OR following)
- When changing mutation signatures, update: `http.ts` API handlers + all frontend callers

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS, shadcn/ui |
| Backend | Convex (real-time database) |
| Auth | Clerk |
| DNS | Cloudflare |
| Hosting | Vercel |
| IaC | Pulumi (TypeScript) |
| Package Manager | Bun (web), npm (infra) |

## Infrastructure Changes (IMPORTANT)

**All infrastructure changes MUST be made via Pulumi**, not manually in dashboards.

### Pulumi Setup

```bash
cd infra

# Set environment variables
export PULUMI_ACCESS_TOKEN=<from .env>
export PATH="$HOME/.pulumi/bin:$PATH"

# Preview changes
pulumi preview

# Apply changes
pulumi up

# View current state
pulumi stack
```

### Managed Resources

The following are managed by Pulumi in `infra/index.ts`:

- **Cloudflare DNS** (tally-tracker.app zone)
  - A record: @ → Vercel IP
  - CNAME: www → cname.vercel-dns.com
  - TXT: _vercel → domain verification

- **Vercel Domains**
  - tally-tracker.app (primary)
  - www.tally-tracker.app (redirects to root)

- **Clerk Configuration**
  - Redirect URLs for OAuth flows

### Adding New Infrastructure

1. Edit `infra/index.ts`
2. Run `pulumi preview` to see changes
3. Run `pulumi up` to apply
4. Commit changes to git

### Verifying Vercel Environment Variables

After Pulumi changes, verify Vercel env vars via API:
```bash
VERCEL_TOKEN=$(grep VERCEL_API_TOKEN .env | cut -d= -f2)
curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
  "https://api.vercel.com/v9/projects/{projectId}/env?teamId={teamId}" | jq '.envs[] | {key, target}'
```

### Importing Existing Resources

```bash
# Import command format:
pulumi import <type> <name> <id>

# Examples:
pulumi import cloudflare:index/dnsRecord:DnsRecord my-record zone_id/record_id
pulumi import vercel:index/projectDomain:ProjectDomain my-domain team_id/project_id/domain
```

## Environment Variables

All secrets are in the root `.env` file (gitignored).

**Local worktrees:** After updating `.env`, sync to other local clones:
```bash
cp -p .env ~/work/t2/.env && cp -p .env ~/work/t3/.env && cp -p .env ~/work/t4/.env
```

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<clerk_publishable_key>
CLERK_SECRET_KEY=<clerk_secret_key>

# Convex
CONVEX_DEPLOYMENT=dev:...

# Infrastructure
CLOUDFLARE_API_TOKEN=...
VERCEL_API_TOKEN=...
PULUMI_ACCESS_TOKEN=...
```

### GitHub Secrets naming convention

GitHub secrets use environment suffixes (`_DEV`, `_PROD`) but **must be mapped to the standard env var names** that the app expects at runtime:

| Secret Name | Maps to Env Var |
|-------------|-----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV` | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| `CLERK_SECRET_KEY_DEV` | `CLERK_SECRET_KEY` |

Workflows using GitHub Environments (`development`, `production`) handle this mapping automatically. Other workflows (like `performance.yml`) must explicitly map:

```yaml
env:
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV }}
  CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY_DEV }}
```

## Development

```bash
# Web app
cd tally-web
bun install
bun run dev

# Infrastructure
cd infra
npm install
pulumi up
```

## Deployment

- **Web (Vercel)**: Deploys either via Vercel Git integration **or** via GitHub Actions (Vercel CLI).
- **Backend (Convex)**: Not deployed automatically unless CI is configured to run `convex deploy` (requires a deploy key).
- **Auth (Clerk)**: Redirect URL/config changes are managed via Pulumi (see `infra/`); do not rely on manual dashboard edits.
- **Infra**: Always via Pulumi (`cd infra && pulumi up`), locally or in CI.

### Clerk middleware gotcha

- `auth.protect()` in Clerk middleware can surface as a **404** for signed-out users.
- If relocating the app to `/app`, ensure middleware routing doesn’t unintentionally 404 the route (e.g. treat `/app(.*)` as public and handle signed-out UI in the page).

## Migration Plan

See `docs/migration/README.md` for the full migration roadmap.

Current status:
- ✅ Project 1: Next.js Web Migration
- ⏳ Project 2: Shared API Layer
- ⏳ Project 3: iOS App
- ⏳ Project 4: Android App
- ⏳ Project 5: Launch
