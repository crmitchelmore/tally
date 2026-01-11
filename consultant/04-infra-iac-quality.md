# Project 04 — Infrastructure-as-Code quality (Pulumi)

## Objective
Make Pulumi runs idempotent, secure, reviewable, and maintainable over time.

## Observed signals (in this repo)
- `infra/index.ts` uses `command.local.Command` with `curl | jq` to manage Clerk redirect URLs and Sentry resources.
- LaunchDarkly provider is disabled due to diff crashes, leaving a manual config gap.

## Problems
- Shell-driven IaC is fragile (API changes, jq output, rate limits) and hard to diff/review.
- `command.local` introduces implicit dependencies on tools (`curl`, `jq`) and network.
- Managing third-party resources from Pulumi is good, but should be done via stable providers or minimal custom provider wrappers.

## Proposed solution
1. **Replace shell IaC with providers where possible**
   - Clerk: if no official provider, create a tiny custom Pulumi component or use `dynamic.Resource` with typed API calls.
   - Sentry: consider the official Sentry Pulumi provider (or a narrow dynamic provider) instead of `curl`.
2. **Secrets and config hygiene**
   - Keep long-lived tokens in Pulumi config (encrypted) and only pass bootstrap secrets via GitHub.
   - Ensure stack names are always fully qualified in automation.
3. **Drift detection**
   - Schedule `pulumi refresh` / drift checks and alert on diffs.

## Milestones
- M1: Identify which `command.local` resources can be replaced.
- M2: Implement typed provider/dynamic resources.
- M3: Add drift detection cadence.

## Acceptance criteria
- `pulumi preview` is stable and explains diffs without external shell dependencies.
- Infra changes are reviewable with clear planned outputs.
- Provider failures don’t leave the stack half-applied without clear recovery steps.
