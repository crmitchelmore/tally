# PostHog integration plan (Tally)

## Goals
- Instrument **web (Next.js)**, **iOS (Swift/SwiftUI)**, and **Android (Kotlin/Compose)** with a consistent analytics + feature-flag foundation.
- Standardise **event names**, **properties**, and **identity** so dashboards/funnels work across platforms.
- Keep analytics **privacy-safe** (no secrets, no sensitive user content, predictable masking).

## Non-goals
- Capturing PII-heavy payloads (emails, free-text notes, auth tokens, etc.).
- Building a perfect event taxonomy up-front; we’ll start with core funnels and iterate.

---

## 0) PostHog project + environment strategy
1. Create a PostHog project in **EU region** (host: `https://eu.i.posthog.com`).
2. **Infrastructure as Code (IaC) rule**: any hosting/provider configuration required for PostHog (e.g. Vercel environment variables, domains, redirects, integrations) should be managed via **Pulumi** in `infra/` — avoid manual dashboard edits.
3. Decide environment strategy (recommended):
   - **Single project** + property `env: "dev" | "preview" | "prod"` (simpler dashboards)
   - OR separate projects per env (cleaner data separation)
4. Set up baseline dashboards:
   - Activation funnel (sign up → create challenge → first entry)
   - Retention (weekly active users)
   - Feature adoption (streaks, reminders, community)

---

## 1) Web (tally-web, Next.js App Router)
### 1.1 Dependencies
- Use **bun** (project standard):
  - `cd tally-web && bun add posthog-js`

### 1.2 Env vars
Add to `tally-web/.env.local` and Vercel env settings:
- `NEXT_PUBLIC_POSTHOG_KEY=...` (from PostHog project settings)
- `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com`
- Optional but recommended:
  - `NEXT_PUBLIC_APP_ENV=dev|preview|prod`

Server-side (never `NEXT_PUBLIC_`, do not expose to the browser):
- `POSTHOG_ADMIN_TOKEN=...` (use this for PostHog API/admin calls only; store as a secret via Pulumi/Vercel env, not in git)

### 1.3 Initialization (App Router provider)
Create a client-side provider (example structure; exact path depends on current layout):
- `tally-web/src/app/providers.tsx`
  - `posthog.init(NEXT_PUBLIC_POSTHOG_KEY, { api_host, person_profiles: 'identified_only' })`
  - On route change, capture `$pageview` (or rely on autocapture if enabled).

Wrap `tally-web/src/app/layout.tsx` with the provider.

### 1.4 Identity + user properties (Clerk)
When the user is known (after Clerk session is available):
- `posthog.identify(clerkUserId)`
- Set safe person properties (avoid email unless you explicitly want it):
  - `posthog.people.set({ plan: 'free', platform: 'web' })`

If you already sync users into Convex (e.g. `useStoreUser`), use the **stable** ID you rely on everywhere (typically `clerkId`).

### 1.5 First events (web)
Start with high-signal product events (properties kept small and safe):
- `challenge_created` `{ timeframeUnit, targetNumber, year }`
- `entry_added` `{ challengeId, count, hasNote: boolean }` (never send note text)
- `challenge_completed` `{ challengeId }`
- `community_followed_challenge` `{ challengeId }`

Also set a common property for all events:
- `platform: 'web'`
- `env: NEXT_PUBLIC_APP_ENV`

### 1.6 Privacy defaults (web)
- Enable masking (or disable capturing text inputs) so free-text fields aren’t ingested.
- Don’t capture tokens/headers in any custom events.
- Consider an in-app toggle (later) that calls:
  - `posthog.opt_out_capturing()` / `posthog.opt_in_capturing()`

---

## 2) iOS (tally-ios, Swift/SwiftUI)
### 2.1 Install (SPM)
Add the PostHog package:

```swift
dependencies: [
  .package(url: "https://github.com/PostHog/posthog-ios.git", from: "3.0.0")
]
```

> Key handling: don’t hardcode the API key in source control. Prefer an `.xcconfig`, Info.plist entry, or build setting injected per environment.

### 2.2 Configure (App launch)
Initialize as early as possible (App launch), e.g. via an `AppDelegate` adaptor:

```swift
import Foundation
import PostHog
import UIKit

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        let POSTHOG_API_KEY = "<POSTHOG_API_KEY>" // inject via config
        let POSTHOG_HOST = "https://eu.i.posthog.com"

        let config = PostHogConfig(apiKey: POSTHOG_API_KEY, host: POSTHOG_HOST)
        PostHogSDK.shared.setup(config)

        return true
    }
}
```

### 2.3 Identity
Once the user is authenticated (once mobile auth ships):
- Identify with the same stable ID as web (e.g. `clerkId`).
- Set `platform: "ios"` and `env` on events/person properties.

### 2.4 Send events
```swift
PostHogSDK.shared.capture("test-event")
```

Optional: disable person-profile processing for a specific event:
```swift
PostHogSDK.shared.capture(
  "event-without-profile",
  properties: ["$process_person_profile": false]
)
```

### 2.5 Privacy
- Never send note/body text.
- Keep payloads small; no auth tokens/headers.

---

## 3) Android (tally-android, Kotlin/Compose)
### 3.1 Install (Gradle)
```kotlin
dependencies {
    implementation("com.posthog:posthog-android:3.+")
}
```

> Key handling: don’t hardcode the API key in source control. Prefer `local.properties`, CI-injected Gradle property, or buildConfigField per variant.

### 3.2 Configure (Application)
Initialize in your `Application` class:

```kotlin
class SampleApp : Application() {

    companion object {
        const val POSTHOG_API_KEY = "<POSTHOG_API_KEY>" // inject via config
        const val POSTHOG_HOST = "https://eu.i.posthog.com"
    }

    override fun onCreate() {
        super.onCreate()

        val config = PostHogAndroidConfig(
            apiKey = POSTHOG_API_KEY,
            host = POSTHOG_HOST
        )

        PostHogAndroid.setup(this, config)
    }
}
```

### 3.3 Identity + events
- Identify using the same stable ID as web/iOS.
- Track the same core events and screen views.
- Add `platform: "android"` and `env` to all events.

Send an event:
```kotlin
PostHog.capture(event = "test-event")
```

Optional: disable person-profile processing for a specific event:
```kotlin
PostHog.capture(
  event = "event-without-profile",
  properties = mapOf("$process_person_profile" to false)
)
```

---

## 4) Cross-platform event spec (recommended)
Create a single “event contract” doc (or shared package later) defining:
- Event names (snake_case)
- Required properties and types
- Allowed enums (e.g. `timeframeUnit`)
- Which events are **anonymous-only** vs require identity

Initial minimal contract:
- `screen_view`
- `sign_up_started`, `sign_up_completed`
- `challenge_created`
- `entry_added`
- `challenge_archived`
- `challenge_completed`

---

## 5) Rollout plan (safe + incremental)
1. **Week 1**: Web install + pageviews + a handful of key events in dev/preview.
2. **Week 2**: Add identity (Clerk) + funnels + retention dashboards; verify masking.
3. **Week 3**: Add feature flags (if desired) and a first small experiment.
4. **When mobile auth ships**: Integrate iOS + Android SDKs; align event contract; validate parity.
5. Ongoing: tighten naming, remove noisy events, and build a “North Star” dashboard.

---

## 6) Acceptance checks
- Events arrive in PostHog for:
  - anonymous browsing
  - signed-in flows (identify works)
- No sensitive payloads show up (notes, tokens, raw emails unless explicitly approved).
- Funnels for core activation steps show sane counts.
- `platform` and `env` properties are present and correct.
