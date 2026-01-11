# LaunchDarkly Feature Flags

Tally uses [LaunchDarkly](https://launchdarkly.com) for feature flags and experimentation across all platforms.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    LaunchDarkly Dashboard                       │
│                  (flags, targeting, experiments)                │
└───────────────┬─────────────────────────┬───────────────────────┘
                │                         │
                │ Webhook (real-time)     │ SDK polling
                ▼                         ▼
┌───────────────────────┐     ┌───────────────────────────────────┐
│   Convex Backend      │     │         Client Apps               │
│   (server-side eval)  │     │  ┌─────┐  ┌─────┐  ┌─────────┐   │
│                       │     │  │ Web │  │ iOS │  │ Android │   │
│   @convex-dev/        │     │  └──┬──┘  └──┬──┘  └────┬────┘   │
│   launchdarkly        │     │     │        │          │        │
└───────────────────────┘     └─────┴────────┴──────────┴────────┘
```

**Two evaluation paths**:
1. **Client-side** (Web/iOS/Android): SDKs evaluate flags locally for UI decisions
2. **Server-side** (Convex): Component evaluates flags in backend functions

## Environments

| Environment | Purpose | SDK Key Prefix |
|-------------|---------|----------------|
| `test` | Local dev, preview deploys | `sdk-...` |
| `production` | Production app | `sdk-...` |

## Client-Side Integration

### Web (Next.js)

**Provider**: `src/providers/feature-flags-provider.tsx`

```tsx
import { useFlag } from "@/providers/feature-flags-provider";

function MyComponent() {
  const streaksEnabled = useFlag("streaks-enabled", false);
  
  if (streaksEnabled) {
    return <StreaksFeature />;
  }
  return <LegacyFeature />;
}
```

**Environment variable**: `NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID`

### iOS (Swift)

**Service**: `TallyCore/Sources/TallyCore/FeatureFlags/FeatureFlags.swift`

```swift
@EnvironmentObject var featureFlags: FeatureFlags

var body: some View {
  if featureFlags.streaksEnabled {
    StreaksView()
  } else {
    LegacyView()
  }
}
```

**Build setting**: `LAUNCHDARKLY_MOBILE_KEY` in xcconfig/Xcode

### Android (Kotlin)

**Service**: `app/src/main/java/app/tally/featureflags/FeatureFlags.kt`

```kotlin
val streaksEnabled by FeatureFlags.streaksEnabled.collectAsStateWithLifecycle()

if (streaksEnabled) {
  StreaksScreen()
} else {
  LegacyScreen()
}
```

**Build config**: `LAUNCHDARKLY_MOBILE_KEY` environment variable at build time

## Server-Side Integration (Convex)

The Convex LaunchDarkly component syncs flags in real-time via webhooks, enabling server-side evaluation without API latency.

**Helper**: `convex/lib/launchdarkly.ts`

```typescript
import { launchdarkly } from "./lib/launchdarkly";

export const myMutation = mutation({
  handler: async (ctx, args) => {
    const ld = launchdarkly.sdk(ctx);
    
    const isPremiumEnabled = await ld.boolVariation(
      "premium-features",
      { key: args.userId },
      false
    );
    
    if (!isPremiumEnabled) {
      throw new Error("Premium features not enabled");
    }
    
    // ... premium logic
  },
});
```

### Use Cases for Server-Side Flags

- **Gate mutations**: Prevent access to premium features
- **A/B test algorithms**: Compare different ranking/sorting logic
- **Gradual rollouts**: Enable new queries for % of users
- **Kill switches**: Disable expensive operations instantly

## Identity Strategy

All platforms use the same user context for consistent targeting:

| Attribute | Value | Description |
|-----------|-------|-------------|
| `key` | Clerk user ID | Primary identifier (or "anonymous") |
| `platform` | `web` / `ios` / `android` | Platform identifier |
| `env` | `dev` / `preview` / `prod` | Deployment environment |
| `anonymous` | boolean | Whether user is authenticated |

## Flag Naming Convention

- Use **kebab-case**: `streaks-enabled`, `new-onboarding`
- Be **descriptive**: `premium-export-csv` not `feature-1`
- Include **owner** and **expiry** in flag description

## Current Flags

| Flag Key | Type | Description |
|----------|------|-------------|
| `streaks-enabled` | boolean | Enable streak tracking feature |

## Configuration

### Environment Variables

**Root `.env` (example values; do not commit real secrets)**:
```bash
# LaunchDarkly Admin (for Pulumi)
LAUNCHDARKLY_ADMIN_TOKEN=api-...

# Test environment
NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID=...
LAUNCHDARKLY_SDK_KEY_TEST=sdk-...
LAUNCHDARKLY_MOBILE_KEY_TEST=mob-...

# Production environment
LAUNCHDARKLY_SDK_KEY_PROD=sdk-...
LAUNCHDARKLY_MOBILE_KEY_PROD=mob-...
```

**Convex env var** (set via CLI):
```bash
npx convex env set LAUNCHDARKLY_SDK_KEY sdk-...
```

### Webhook Configuration

The Convex component receives real-time flag updates via webhook:

| Setting | Value |
|---------|-------|
| **Webhook URL** | `https://gallant-boar-375.convex.site/ld/webhook` |
| **Component API Token** | Generate with `npx convex run --component=launchdarkly tokens:generate` |

Configure at: **LaunchDarkly Dashboard → Settings → Integrations → Convex**

## Infrastructure as Code

LaunchDarkly resources are managed via Pulumi in `infra/index.ts`:

- Project with dev/preview/prod environments
- Feature flags (created via IaC)
- Vercel env vars for SDK keys

```bash
cd infra && pulumi up
```

## Adding a New Flag

1. **Create in LaunchDarkly Dashboard** (or via Pulumi)
2. **Add to client code** with `useFlag()` / `FeatureFlags.isEnabled()`
3. **Add to server code** (if needed) with `ld.boolVariation()`
4. **Document** in this file

## Troubleshooting

### Flags not updating in Convex
- Check webhook is configured correctly
- Verify `LAUNCHDARKLY_SDK_KEY` is set: `npx convex env get LAUNCHDARKLY_SDK_KEY`
- Check Convex logs for webhook errors

### Flags not updating on client
- Ensure `NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID` is set
- Check browser console for SDK errors
- Verify user is identified after auth

### Different values on client vs server
- Ensure same user key is used (Clerk ID)
- Check targeting rules apply to both contexts
