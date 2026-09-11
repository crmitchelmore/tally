# Sign in with Apple

Tally uses Clerk's native `AuthView` on iOS and `SignIn`/`SignUp` components on web. Apple is enabled alongside Google in the production Clerk instance. The native SDK requests only `.email` and `.fullName`; Apple can supply a private relay address. Optional native telemetry remains off by default, and is not used for advertising.

## Production configuration

- Apple team: `8X4ZN58TYH`.
- Native app: `app.tally.ios` (Apple identifier `QC3SKD3JH5`), enabled as a primary Sign in with Apple App ID.
- Web service: `app.tally-tracker.web` (identifier `N6A45LKM9N`), grouped with the native app.
- Web domain: `clerk.tally-tracker.app`.
- Return URL: `https://clerk.tally-tracker.app/v1/oauth_callback`.
- Private email relay sender: `bounces+59210763@clkmail.tally-tracker.app`, registered with Apple.
- Key: `Tally Apple Login`, scoped only to Tally Sign in with Apple. Private key material is held in Clerk and private release storage, never in this repository.

The canonical iOS entitlement is in `ios/App/Project.swift`. The release workflow checks the signed provisioning profile for `com.apple.developer.applesignin = [Default]`, recreating stale profiles and failing if a replacement still lacks it. The widget does not request this entitlement.

## Verification before resubmission

1. Confirm Apple's connection is enabled for sign-up and sign-in in production Clerk, and the iOS native application matches the team and bundle above.
2. Open both web authentication pages and confirm Apple and Google are available with equivalent prominence. Apple must redirect to the registered web service requesting only name and email.
3. Complete a first Apple sign-up with Hide My Email, verify the account reaches Tally, reload, then verify returning sign-in. Keep credentials and auth tokens out of logs and review notes.
4. On the signed iOS app, open Sign in and choose Apple. Verify the native Apple sheet and complete sign-in on an Apple-account-authenticated device. Test cancellation and the existing Google/email options.
5. Verify the uploaded build is processed, select the replacement in App Store Connect, explain the 4.8 fix in review notes, then resubmit. A visible button or successful build alone does not prove the authentication round trip.

On 11 September 2026, production provider activation, web redirect to Apple, and the native Apple authentication sheet were observed. Full account authentication and replacement-build submission are still pending; the current status and evidence are maintained in the existing Notion ENG-TALLY record.
