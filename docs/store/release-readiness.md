# Tally 1.9.0 store release

Last verified: 8 September 2026. Both public store listings are still drafts.

Production deployment 34286068028 succeeded. Privacy, support and deletion pages each returned HTTP 200; the deletion page was also verified in the Codex browser, including successful sign-in with the dedicated reviewer account.

## Store records

- Apple app: 6757677046, bundle `app.tally.ios`, team `8X4ZN58TYH`.
- Widget: `app.tally.ios.widget`, shared group `group.app.tally-tracker.shared`.
- App Store draft: 1.9.0, English (UK), Productivity / Lifestyle.
- Google developer: 7672785519943663522; app record: 4975549330736448398.
- Android package `com.tally.app` was rejected by Play because another app owns it. A replacement permanent identifier is pending owner input; no accepted bundle exists yet.
- App policy: https://tally-tracker.app/privacy
- Support: https://tally-tracker.app/support
- Account deletion: https://tally-tracker.app/delete-account

## Release configuration

- `.github/workflows/ios-testflight.yml` manages the existing Apple signing/upload lane (see `docs/ios-testflight-setup.md`).
- `.github/workflows/android-store.yml` builds a signed AAB, runs release unit tests, verifies the signature, uploads Sentry mappings and retains the bundle/mapping artifacts. Optional Play upload creates a draft in internal or alpha testing.
- `.github/workflows/store-assets.yml` captures real iPhone Pro Max, iPad Pro 13-inch and Android emulator screenshots using fictional local data.
- `.github/workflows/deploy-production.yml` deploys Convex before the website.
- Production Convex: `bright-jackal-396`; deployment-only credential is saved as GitHub `CONVEX_DEPLOY_KEY`. The production backup created on 8 September before the auth/deletion deployment completed successfully.
- Sentry organization `tally-lz`, projects `apple-ios` and `android`; Android project ID 4510687487328337. DSNs and upload token are GitHub secrets.
- PostHog EU project 114447; public ingestion key is provided through existing GitHub configuration.

## Android upload-key recovery

The previous GitHub keystore value was invalid, and Play confirmed there were no existing bundles. A first upload key was created on 8 September 2026.

Private recovery files are outside Git at `~/.config/tally/release/` (directory mode 700, files mode 600): `android-upload.p12` and `android-signing.json`. Back these up securely; do not commit them. GitHub has `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_PASSWORD`, and `ANDROID_KEY_ALIAS`.

Alias: `tally-upload`. Format: PKCS12. Public certificate SHA-256:
`A3:C9:D4:8B:19:68:9E:F7:0E:E1:F0:81:53:CA:37:E4:96:E2:AA:78:8F:F7:EA:B9:5E:22:B3:60:F6:E7:12:54`.

## Privacy behavior

Native analytics and crash reporting are independently default-off. Initial setup offers Save my choices and Continue without sharing; Settings can withdraw either choice. SDKs are initialized only after consent. Native PostHog captures explicit feature events, with replay, automatic screen/lifecycle capture and advertising identifiers disabled. GeoIP enrichment is disabled. Sentry excludes account details, screenshots, view hierarchy, breadcrumbs and performance traces.

Apple ATT is not used: there is no cross-company advertising tracking. SDK installation does not provide consent automatically. Essential login, sync and security processing remains separate from optional telemetry. API requests propagate native analytics consent to prevent server-side events bypassing the choice.

Account deletion requires a verified Clerk session and uses its identity for Convex deletion; callers cannot select another account. It removes owned goals, entries, follows and user records, including Trash, then deletes the Clerk account. Offline copies and retained provider backups require the handling described in the privacy policy.

## Remaining release gates

- Owner App Review contact phone number. Complete and verify the Apple review-contact section with the saved dedicated login after providing the required phone number.
- Account-wide Apple MRDP personal-services declaration.
- Android permanent package-name choice after collision.
- Community report/block/filtering support, or an explicitly agreed first-release scope without public sharing/discovery.
- Apple privacy labels are published. Review metadata, screenshots, current 1.9.0 build selection and review submission remain.
- Google content rating, accepted bundle and tester configuration. IARC terms were accepted with explicit owner approval; the questionnaire is saved in progress pending the community-scope decision.
- Google personal-account production access requires at least 12 opted-in closed testers continuously for 14 days, followed by an application for production access. No testers were enrolled when inspected.
- Verify Play service-account credentials against the accepted package before relying on automated draft upload.

## Verification captured

- Local iOS simulator build succeeded with privacy controls. The first iOS consent UI run found the decline action was unreliable; actions were moved to a fixed bottom area. The decline and relaunch test then passed in run 34280532559.
- Android privacy instrumentation tests passed on the first consent implementation.
- Android signed release and release unit tests passed in run 34278297388; Play then rejected its package name.
- Web tests: 82 passed, including six authenticated account-deletion identity tests; TypeScript passed. CI 34285918781 passed on all platforms; web and Android E2E jobs in 34285918790 passed.
- Production health returned healthy with Clerk and Convex connected after backend deployment.
- Unauthenticated production account-deletion invocation was rejected; full signed-in deletion flow still needs an isolated test account.

Do not describe TestFlight processing, draft Play uploads or passing CI as public store publication. Confirm the actual store release state.

## Optional tips

Apple has no configured in-app purchase products. The app now shows an honest unavailable state after loading instead of an endless spinner. No new tip prices have been invented or activated. Product IDs in both clients are `tip_small`, `tip_medium`, and `tip_large`.

## Store setup saved during this release

Apple privacy labels are published for nine data types: name, email, user ID, device ID, user content, fitness, product interactions, crash data and performance data. No advertising tracking is declared. Pricing is free in all 175 regions, with worldwide availability on release. Google privacy, no-ads, non-government, no-financial-services, no-advertising-ID and manual activity/fitness declarations are saved. The completed data-safety declaration discloses optional account, fitness, content, interaction, identifier and diagnostic collection. Target audience is 13–15, 16–17 and 18+, consistent with the app's 13+ policy. Productivity category, support email and website are saved. English (UK) listing copy, icon, feature graphic and two verified 1080 x 1920 Android screenshots are saved and marked Ready to send for review. Only the new feature graphic is labelled as created using AI. Content rating remains unfinished.

A dedicated store review identity was provisioned with a generated password using the existing production Clerk administration credential. The password was never written to logs. Its encrypted artifact from run 34282135746 was decrypted into `~/.config/tally/release/store-review-account.json` (mode 600); encrypted GitHub secrets `APP_REVIEW_EMAIL` and `APP_REVIEW_PASSWORD` preserve the same configuration. Production sign-in succeeded with this account. Google Play confirms the saved declaration contains username, password and instructions after reload. App Store Connect's review contact still requires the owner's phone; verify the whole section after completing that field. The local RSA recovery key is `store-review-private.pem`; only its public key is saved in GitHub. Do not reset the review password during an active store review.

Browser DOM snapshots can omit sensitive field values even when those fields are populated. Never interpret an empty-string match as proof a credential was saved. Load private credentials through an explicit local copy control, verify non-empty lengths, clear the clipboard, and validate the login against the actual service.

## iOS 1.9.0 upload evidence

Run 34285525613 uploaded build 26090890; Apple validated and processed it (build ID `caebc4b2-90cb-4bbb-8b16-f2cb8b28f082`). App Store Connect shows the existing internal Beta Testers group attached with one tester, and build status Ready to Submit. What to Test notes are saved. The App Store version picker did not offer this build when checked; build selection and review-contact saving remain unresolved.

The old release workflow incorrectly printed distribution complete after failed external-review and internal-group API requests. `scripts/distribute-testflight.mjs` now verifies existing group membership, avoids external beta review for internal groups, and fails on rejected requests rather than interpreting arbitrary 409 responses as success. Seven focused tests pass. A future workflow run must verify this corrected automation against Apple; local tests alone do not prove tester delivery.

Production account deletion now uses the same cookie-first identity as authentication when cookie and bearer credentials coexist. The confirmation page visibly identifies the signed-in account email. Actual destructive deletion remains untested with an isolated production account.
