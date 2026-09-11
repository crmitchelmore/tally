# Tally analytics and error reporting

## Service ownership

Tally uses its existing EU PostHog organisation and project, [Tally (114447)](https://eu.posthog.com/project/114447). Production bundles were checked against this project's public ingestion key on 8 September 2026. No new account or Cloudflare email route is required.

Sentry organisation: [Tally (`tally-lz`)](https://tally-lz.sentry.io/). Web project: `javascript-nextjs` (4510687276761168). The iOS app uses its separate project (4510687285805136). Public DSNs are ingestion destinations, not account credentials.

## Web

`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (EU default), and `NEXT_PUBLIC_SENTRY_DSN` are already GitHub repository secrets and are passed into production builds and Vercel. Client analytics records app opens and route pageviews, identifies Clerk users by ID, and resets identity on sign-out/account changes. Query strings and fragments are removed from tracked URL fields. Autocapture and PostHog replay are disabled; DNT is respected. Sentry error replay masks text and blocks media.

API analytics captures creation, edits, archival, entry deletion, and import/export using the existing canonical event names. Delivery is awaited with a bounded timeout, and telemetry failures do not fail successful user actions. Browser events use `source=client`; API events use `source=server`. API events describe persisted changes, while native client events describe local actions; do not sum the two as separate conversions.

Next.js request-error and router-transition hooks connect server rendering failures and browser navigation tracing to Sentry. The scoped `SENTRY_AUTH_TOKEN` repository secret enables web source-map uploads. Its Sentry organization token is named `Tally GitHub Actions uploads`, with only the `org:ci` scope. This token is build-only and must never use a `NEXT_PUBLIC_` prefix. Existing Vercel build configuration is preserved when the GitHub token is absent. A labelled informational smoke event was verified in the Sentry dashboard on 8 September 2026.

## iOS

The shipped app lives in `ios/`, not the historical `tally-ios/` tree. Its TallyCore analytics facade uses the official PostHog SDK, with explicit app-open, auth, challenge and entry events. Goal names, notes, email addresses, screen contents and session replays are not captured. Tests disable analytics and Sentry. The SDK handles its local event queue and flushes when the app backgrounds.

The TestFlight workflow passes `TUIST_POSTHOG_KEY` and `TUIST_POSTHOG_HOST` from the same repository secrets into Tuist. Local builds have analytics disabled unless a key is explicitly supplied before `tuist generate`. PostHog and Sentry remain off until separately enabled in the privacy prompt or Settings. Withdrawal closes the corresponding SDK. Native analytics disables GeoIP enrichment, and API events honour the consent header and exclude goal/entry content. Sentry excludes screenshots, view hierarchy, account details and breadcrumbs. The TestFlight archive uploads dSYMs to the existing `apple-ios` project using the same scoped CI token.

## Verification

From `tally-web`, run `bun run test`, `bunx tsc --noEmit`, and `bun run build` with the normal application configuration. The telemetry tests cover awaited delivery, ingestion outages, missing configuration and anonymous API requests.

For an explicit live smoke test, provide the two public ingestion credentials in the environment and run `node scripts/verify-observability.mjs`. It emits `telemetry_verification` under `env=verification`, plus an informational Sentry event. The output includes a verification ID and Sentry event ID. Confirm them in the service dashboards: a completed SDK request or flushed queue alone is not proof of dashboard ingestion. The script creates no challenges, entries or user accounts.

Official SDK guidance: [PostHog Vercel delivery](https://posthog.com/docs/libraries/vercel), [PostHog iOS](https://posthog.com/docs/libraries/ios), [Sentry Next.js setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/).

## Android

`core:telemetry/PrivacyTelemetry.kt` initializes PostHog and Sentry only after their independent persisted choices. The SDK auto-init and advertising-ID permission are disabled. The signed release workflow supplies the ingestion settings and uploads mappings to Sentry project `android` (4510687487328337). Android currently records anonymous explicit app-open, goal-created and entry-created events.
