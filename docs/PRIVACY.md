# Privacy & Data Governance

This document defines how Tally handles user data, analytics, and privacy compliance.

## Data Classification

### Personal Identifiable Information (PII)

Data that can identify a user:

| Data | Classification | Storage | Retention |
|------|---------------|---------|-----------|
| Email | PII | Convex (users table) | Account lifetime |
| Name | PII | Convex (users table) | Account lifetime |
| Avatar URL | PII | Convex (users table) | Account lifetime |
| Clerk ID | PII | Convex (users table) | Account lifetime |

### Sensitive Data

Data that requires extra protection:

| Data | Classification | Storage | Notes |
|------|---------------|---------|-------|
| Auth tokens | Sensitive | Clerk only | Never stored in Convex |
| Session data | Sensitive | Clerk only | Short-lived |

### Operational Data

Non-PII data for app functionality:

| Data | Classification | Storage | Retention |
|------|---------------|---------|-----------|
| Challenges | User content | Convex | Account lifetime |
| Entries | User content | Convex | Account lifetime |
| Feature flags | Operational | LaunchDarkly | Indefinite |
| Error traces | Operational | Sentry | 90 days |
| Analytics events | Operational | PostHog | 1 year |

## Analytics Rules

### What We Track

Events tracked in PostHog (see `docs/ANALYTICS.md`):

- `challenge_created` - User created a challenge
- `entry_created` - User logged an entry
- `challenge_viewed` - User viewed a challenge
- `challenge_shared` - User shared a challenge

### What We DON'T Track

**Never include in analytics events:**

- ❌ Email addresses
- ❌ Full names
- ❌ Exact challenge names (could contain PII)
- ❌ Entry notes (could contain PII)
- ❌ IP addresses (hashed by PostHog)
- ❌ Precise location

### User Identification

```typescript
// ❌ Wrong: Raw user ID
analytics.track('entry_created', { userId: 'user_abc123' });

// ✅ Correct: Hashed user ID
analytics.track('entry_created', { 
  userId: hashUserId(clerkId),  // SHA-256 hash
  $set_once: { platform: 'web' }
});
```

Hash function (from `src/lib/analytics.ts`):

```typescript
function hashUserId(id: string): string {
  return crypto.subtle.digest('SHA-256', 
    new TextEncoder().encode(id)
  ).then(buf => 
    Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  );
}
```

## Telemetry & Logging

### Sentry

**Allowed:**
- Error messages
- Stack traces
- User ID (hashed)
- Device/browser info

**Scrubbed automatically:**
- Passwords
- Auth tokens
- Credit cards

**Manually avoid:**
- User content (names, notes)
- Exact URLs with PII

```typescript
// ❌ Don't include user content
Sentry.captureException(error, {
  extra: { challengeName: challenge.name }  // Could contain PII
});

// ✅ Include only non-PII metadata
Sentry.captureException(error, {
  extra: { challengeId: challenge.id, hasName: !!challenge.name }
});
```

### Application Logs

Server logs should:
- Use structured logging
- Never log PII directly
- Include request IDs for correlation
- Mask sensitive fields

```typescript
// ❌ Don't log PII
console.log(`User ${email} created challenge ${name}`);

// ✅ Log sanitized data
console.log({ 
  event: 'challenge_created',
  userId: hashUserId(userId),
  challengeId: id,
  requestId: ctx.requestId
});
```

## Retention Policies

| System | Data | Retention | Deletion |
|--------|------|-----------|----------|
| Convex | User data | Until account deletion | Hard delete |
| Convex | Challenges | Until account deletion | Hard delete |
| Convex | Entries | Until account deletion | Hard delete |
| Clerk | Auth data | Until account deletion | Automatic |
| Sentry | Errors | 90 days | Automatic |
| PostHog | Events | 1 year | Automatic |
| Grafana | Metrics | 13 months | Automatic |

## Account Deletion

When a user deletes their account:

### 1. Convex Data

```typescript
// Delete all user-owned data
async function deleteUserData(userId: Id<"users">) {
  // Delete entries
  const entries = await ctx.db
    .query("entries")
    .withIndex("by_user", q => q.eq("userId", userId))
    .collect();
  for (const entry of entries) {
    await ctx.db.delete(entry._id);
  }
  
  // Delete challenges
  const challenges = await ctx.db
    .query("challenges")
    .withIndex("by_user", q => q.eq("userId", userId))
    .collect();
  for (const challenge of challenges) {
    await ctx.db.delete(challenge._id);
  }
  
  // Delete follows
  const follows = await ctx.db
    .query("followedChallenges")
    .withIndex("by_user", q => q.eq("userId", userId))
    .collect();
  for (const follow of follows) {
    await ctx.db.delete(follow._id);
  }
  
  // Delete user record
  await ctx.db.delete(userId);
}
```

### 2. Clerk Account

Clerk account deletion handled automatically when user deletes via Clerk UI.

### 3. Analytics (PostHog)

```typescript
// Request data deletion from PostHog
// This anonymizes historical events
await posthog.capture({
  distinctId: hashedUserId,
  event: '$delete',
});
```

### 4. Error Tracking (Sentry)

Sentry data expires automatically (90 days). For immediate deletion:
- Open support ticket with Sentry
- Provide hashed user ID

## Mobile App Store Compliance

### iOS (App Store)

Required privacy disclosures:
- Data collected: Usage data, identifiers
- Data linked to user: User ID (hashed)
- Data not linked: Analytics events
- Tracking: No cross-app tracking

### Android (Play Store)

Data safety form:
- Data collected: App activity, app info
- Data shared: None
- Data encrypted in transit: Yes
- Data deletion available: Yes

## GDPR Considerations

For EU users:

- **Lawful basis**: Legitimate interest (app functionality), Consent (analytics)
- **Data export**: Available via account settings
- **Data deletion**: Available via account settings
- **Data portability**: JSON export of all user data

## Checklist for New Features

Before shipping features that handle data:

- [ ] Classified all new data fields
- [ ] No PII in analytics events
- [ ] No PII in error tracking
- [ ] Retention policy defined
- [ ] Account deletion updated
- [ ] Privacy policy updated if needed
