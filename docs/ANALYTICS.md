# Tally Analytics Event Taxonomy

This document defines the canonical analytics events across all platforms (web, iOS, Android).

## Event Naming Convention

Events follow the pattern: `<noun>_<verb>` in snake_case.

- **Nouns**: user, challenge, entry, streak, share
- **Verbs**: created, updated, deleted, viewed, completed

## Core Events

### Authentication

| Event | Description | Properties |
|-------|-------------|------------|
| `user_signed_up` | User completed registration | `method` (oauth/email), `platform` |
| `user_signed_in` | User authenticated | `method`, `platform` |
| `user_signed_out` | User logged out | `platform` |

### Challenges

| Event | Description | Properties |
|-------|-------------|------------|
| `challenge_created` | New challenge created | `timeframe_unit`, `target_number`, `is_public`, `platform` |
| `challenge_updated` | Challenge settings changed | `fields_changed[]`, `platform` |
| `challenge_archived` | Challenge archived | `total_entries`, `completion_pct`, `platform` |
| `challenge_deleted` | Challenge deleted | `platform` |
| `challenge_viewed` | Challenge detail page viewed | `challenge_id`, `is_own`, `platform` |
| `challenge_shared` | Challenge share initiated | `share_method`, `platform` |

### Entries

| Event | Description | Properties |
|-------|-------------|------------|
| `entry_created` | Entry logged | `count`, `has_note`, `has_sets`, `has_feeling`, `platform` |
| `entry_updated` | Entry modified | `fields_changed[]`, `platform` |
| `entry_deleted` | Entry removed | `platform` |

### Streaks & Milestones

| Event | Description | Properties |
|-------|-------------|------------|
| `streak_achieved` | User hit a streak milestone | `streak_days`, `challenge_id`, `platform` |
| `milestone_reached` | Progress milestone hit | `milestone_type` (25%, 50%, 75%, 100%), `platform` |
| `goal_completed` | Challenge target reached | `days_to_complete`, `platform` |

### Social

| Event | Description | Properties |
|-------|-------------|------------|
| `challenge_followed` | User followed a challenge | `challenge_id`, `platform` |
| `challenge_unfollowed` | User unfollowed | `challenge_id`, `platform` |
| `leaderboard_viewed` | Leaderboard page viewed | `platform` |

### Navigation (Web Only)

| Event | Description | Properties |
|-------|-------------|------------|
| `page_viewed` | Page navigation | `path`, `referrer` |

## Standard Properties

Every event MUST include:

```typescript
{
  // Auto-populated
  timestamp: string;      // ISO 8601
  distinct_id: string;    // Hashed user ID (not raw clerkId)
  
  // Required on all events
  platform: "web" | "ios" | "android";
  app_version: string;    // e.g., "1.0.0"
  
  // Optional context
  experiment_variants?: Record<string, string>;
}
```

## Privacy Rules

### DO NOT track:
- Email addresses
- Full names
- IP addresses (configure analytics to not store)
- Raw user IDs (hash them)

### DO track:
- Hashed/anonymous identifiers
- Feature usage patterns
- Performance metrics
- Error events

## Implementation

### Web (PostHog)

```typescript
import posthog from 'posthog-js';

// Initialize (once)
posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
  api_host: 'https://app.posthog.com',
  disable_session_recording: true, // Privacy-first
  capture_pageview: false, // Manual control
});

// Track event
posthog.capture('entry_created', {
  count: 10,
  has_note: true,
  platform: 'web',
  app_version: '1.0.0',
});

// Identify user (with hashed ID)
posthog.identify(hashedUserId, {
  platform: 'web',
});
```

### iOS (PostHog Swift)

```swift
import PostHog

// Initialize
let config = PostHogConfig(apiKey: "...")
config.captureScreenViews = false
PostHogSDK.shared.setup(config)

// Track event
PostHogSDK.shared.capture("entry_created", properties: [
  "count": 10,
  "has_note": true,
  "platform": "ios",
  "app_version": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "unknown"
])
```

### Android (PostHog Kotlin)

```kotlin
import com.posthog.android.PostHog

// Track event
PostHog.capture("entry_created", mapOf(
  "count" to 10,
  "has_note" to true,
  "platform" to "android",
  "app_version" to BuildConfig.VERSION_NAME
))
```

## Feature Flag Events

When using LaunchDarkly flags, automatically track:

| Event | Description |
|-------|-------------|
| `feature_flag_evaluated` | Flag was checked |
| `experiment_viewed` | User saw experiment variant |

## Dashboards

### Key Metrics
1. **DAU/WAU/MAU** - Active users
2. **Entry rate** - Entries per active user
3. **Completion rate** - % of challenges reaching target
4. **Streak distribution** - Histogram of streak lengths
5. **Platform split** - Usage by platform

### Funnel: New User Activation
1. Signed up
2. Created first challenge
3. Logged first entry
4. Logged entry on day 2
5. Achieved 7-day streak

## Flag Governance

Every feature flag must have:

| Field | Description |
|-------|-------------|
| `key` | Unique identifier |
| `owner` | Team member responsible |
| `created_date` | When flag was created |
| `expiry_date` | When to remove (max 90 days for experiments) |
| `rollout_plan` | % rollout schedule |
| `kill_switch` | How to disable if issues |

### Flag Cleanup Process
- Weekly review of flags > 30 days old
- Flags at 100% rollout for > 14 days should be removed
- Dead flags (0% or not evaluated) cleaned monthly
