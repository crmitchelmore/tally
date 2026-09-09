# Tally 1.9.0 store release

Last verified: 9 September 2026. Neither public store release is live.

## Current evidence

Private-release commit `19d8512` passed web, iOS and Android CI and all three UI/E2E jobs (runs 34291174034 and 34291174041). It was deployed to https://tally-tracker.app by run 34291612345. Production health is healthy; signed-in creation of a private reading goal and logging 25 pages worked and persisted after reload. Anonymous direct database queries are rejected.

The icon refresh supersedes that candidate. Re-run builds and select the new icon-bearing build before submitting to Apple or Google.

## Store records

- Apple app 6757677046; bundle `app.tally.ios`; team `8X4ZN58TYH`; widget `app.tally.ios.widget`; shared group `group.app.tally-tracker.shared`.
- Apple draft 1.9.0: English (UK), Productivity/Lifestyle, free in 175 regions. Review identity and owner contact, including phone, are saved. Validate the full section again on submission.
- Apple MRDP no-personal-services declaration is Active. Content rights are saved as no third-party content. Age rating is 13+ (legacy OS 12+, regional exceptions). Privacy labels are published for nine data types with no advertising tracking.
- Last fully verified processed TestFlight build: 1.9.0 (26090883), build ID `4bc6aace-5c27-4a22-aecd-909120698f89`, run 34288281110. One existing internal group was verified. This older build is not the private release candidate.
- Google developer 7672785519943663522; app 4975549330736448398; permanent package `app.tally.android`.
- Google accepted the signed 1.9.0 bundle, code 1788910465, into Alpha draft release 1, track 4698619127693668718. UK and US regions are saved. The initial large version-code jump needs confirmation; future codes use 1800000000 plus workflow run number, leaving nearly 300 million updates rather than advancing every second.
- Google IARC completed: Everyone/PEGI 3/USK all ages/IARC 3+. Audience 13–15, 16–17, 18+. Data safety, app access, no ads, non-government, no financial services, no advertising ID, support and deletion declarations are saved.
- Two Android screenshots from private-release run 34291205728 were uploaded and verified after reopening the listing. iOS screenshots must be refreshed for the private release. Icon and feature-graphic changes must also be saved in Play.

## Delivery configuration

- `.github/workflows/ios-testflight.yml`: existing signing, upload, processing and verified internal-group distribution. `scripts/distribute-testflight.mjs` fails on API errors and does not mistake arbitrary 409s for success; seven focused tests pass.
- `.github/workflows/android-store.yml`: signed AAB, release tests, signature verification, Sentry mappings and retained artifacts; optional upload creates a draft on internal or Alpha testing only.
- `.github/workflows/store-assets.yml`: real iPhone/iPad/Android screenshots with fictional local data.
- `.github/workflows/deploy-production.yml`: authenticated web client first, then Convex enforcement, then smoke tests.
- Convex production `bright-jackal-396`, with deployment credential in GitHub `CONVEX_DEPLOY_KEY`. Pre-auth/deletion deployment backup completed on 8 September.
- Sentry `tally-lz`, projects `apple-ios`, `android` and `javascript-nextjs`. PostHog EU project 114447. Ingestion keys and DSNs are existing GitHub secrets.
- Google Cloud project `tally-tracker-484110`, existing service account `tally-tracker-service-account@tally-tracker-484110.iam.gserviceaccount.com`. A valid replacement JSON key was saved privately and in GitHub on 9 September; the Android Publisher API was enabled. App-scoped Play permissions still require verification before automated upload can be considered working.

## Private recovery configuration

`~/.config/tally/release/` is outside Git, mode 700, with files mode 600. It contains the private checkpoint, review credentials, Android upload key/signing JSON, Google Play service-account JSON, tester shortlist and unsent invitation draft. Do not print or commit secrets. Back up these files securely.

The Android upload alias is `tally-upload`; PKCS12 certificate SHA-256:
`A3:C9:D4:8B:19:68:9E:F7:0E:E1:F0:81:53:CA:37:E4:96:E2:AA:78:8F:F7:EA:B9:5E:22:B3:60:F6:E7:12:54`.

Dedicated review credentials are also stored as encrypted GitHub secrets. Google review sign-in instructions are saved and real production sign-in succeeded. Do not reset that password during review. Browser snapshots can redact sensitive fields; an empty string is not proof of persistence. Verify actual login, clear the clipboard after private credential entry, and do not log passwords.

## Privacy and data ownership

Optional native analytics and crash reporting are independently off until consent. Setup offers Save my choices and Continue without sharing; Settings can withdraw either choice. Native PostHog uses explicit feature events, no replay, automatic screen/lifecycle capture, advertising IDs or GeoIP enrichment. Sentry excludes account details, screenshots, view hierarchy, breadcrumbs and performance traces. API events respect the native analytics consent header.

There is no cross-company advertising tracking and no Apple ATT prompt. Essential login/sync/security processing is separate from optional telemetry. Account deletion uses the verified cookie-first Clerk identity, deletes owned goals/entries/follows including Trash, moderation reports/blocks and then the Clerk account. Full destructive production deletion still needs a separate disposable test account.

Every public Convex user/goal/entry function verifies JWT ownership, including legacy owner IDs. Concurrent API requests use independent authenticated Convex clients. Private-release discovery returns no goals, sharing controls and community navigation are hidden across all clients, new/updated goals stay private, and new follows are rejected. Existing data is preserved.

Moderation reports quarantine legacy public goals immediately and have deduplication/rate limits. Block lists are private. The review queue at `/app/moderation` is allowlisted with the owner's Clerk identity through `COMMUNITY_MODERATOR_IDS`; positive admin UI access still needs verification. Decisions record moderator identity, timestamp and reason and never republish content.

Before ever re-enabling community, add report/block controls on each platform, enforce blocks in discovery/follow queries, require standards acceptance and establish the response/appeal process. The current backend is moderation infrastructure for a disabled community, not a complete live community workflow.

## Remaining external gates

1. Upload and select the icon-bearing private iOS build, replace old community screenshots, validate review fields and submit to App Review.
2. Verify Play service-account permissions and new draft upload, update listing artwork and roll out the closed test once testers are configured.
3. Obtain at least 12 real Android testers opted in continuously for 14 days, then apply for production access. No testers are enrolled and no 14-day clock has started. Contacts are only a shortlist; invitation sending still awaits explicit owner approval.
4. Complete any review feedback, publish and verify both actual public store pages.

The hourly `finish-tally-store-releases` follow-up continues these gates and stays quiet unless there is meaningful progress or required input. TestFlight processing, draft uploads and green CI are not public store publication.

## Optional tips

No Apple or Google tip products are configured. The app honestly shows unavailable after loading; no prices or paid services have been invented. Revisit store purchase declarations before activating products `tip_small`, `tip_medium` or `tip_large`.

Policy: https://tally-tracker.app/privacy · Support: https://tally-tracker.app/support · Deletion: https://tally-tracker.app/delete-account
