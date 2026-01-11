# Tally API

Convex HTTP endpoints for mobile + integrations.

## Base URL

| Environment | Versioned (recommended) | Legacy (deprecated) |
|-------------|------------------------|---------------------|
| Production | `https://bright-jackal-396.convex.site/api/v1` | `https://bright-jackal-396.convex.site/api` |
| Development | `https://<deployment>.convex.site/api/v1` | `https://<deployment>.convex.site/api` |

Note: the Convex React client uses `NEXT_PUBLIC_CONVEX_URL` (typically `https://<deployment>.convex.cloud`), but HTTP routes are served from `.convex.site`.

## API Versioning

- **Current version**: `v1` (prefix all paths with `/api/v1/`)
- **Legacy routes**: `/api/*` are deprecated and return `_id` instead of `id`
- **Breaking changes**: Require a version bump (e.g., `/api/v2/`)

### Version Differences

| Feature | `/api/v1/` | `/api/` (legacy) |
|---------|-----------|------------------|
| ID field in responses | `id` | `_id` |
| Recommended for | Mobile apps, new integrations | Backwards compatibility |
| Status | ✅ Active | ⚠️ Deprecated |

## Runtime Validation (Zod)

Request schemas are available in `@tally/shared-types`:

```typescript
import { CreateChallengeSchema, CreateEntrySchema } from "@tally/shared-types";

// Validate input
const result = CreateChallengeSchema.safeParse(data);
if (!result.success) {
  console.error(result.error.message);
}
```

Available schemas:
- `CreateChallengeSchema` / `UpdateChallengeSchema`
- `CreateEntrySchema` / `UpdateEntrySchema`
- `FollowChallengeSchema`
- Response DTOs: `ChallengeDTOSchema`, `EntryDTOSchema`, `FollowedChallengeDTOSchema`

## Authentication

Authenticated endpoints require a Clerk JWT in the Authorization header:

```
Authorization: Bearer <clerk-jwt>
```

### Getting a JWT for manual curl testing

If you’re signed into the web app, you can open the browser console and run:

```js
await window.Clerk.session.getToken();
```

Then use that token as the Bearer token in curl.

## Error format

```json
{ "error": "message" }
```

## Endpoints

> **Note:** All paths below show the v1 version. Prepend `/api/v1` (recommended) or `/api` (legacy).

### POST /auth/user
Returns the Convex `userId` for the authenticated Clerk user (creates it if missing).

Response:
```json
{ "userId": "...", "clerkId": "..." }
```

### GET /challenges
Query params:
- `active=true` (optional)

### POST /challenges
Body:
```json
{
  "name": "Push-ups",
  "targetNumber": 1000,
  "year": 2026,
  "color": "#3b82f6",
  "icon": "dumbbell",
  "timeframeUnit": "year",
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "isPublic": false
}
```

### PATCH /challenges/{id}
Body supports optional fields: `name`, `targetNumber`, `color`, `icon`, `isPublic`, `archived`.

### GET /entries
Query params:
- `challengeId=<challengeId>` (optional)
- `date=YYYY-MM-DD` (optional; only used when `challengeId` is omitted)

### POST /entries
Body:
```json
{
  "challengeId": "...",
  "date": "2026-01-09",
  "count": 50,
  "note": "Morning workout",
  "sets": [{"reps": 20}, {"reps": 15}],
  "feeling": "moderate"
}
```

### PATCH /entries/{id}
Body supports optional fields: `count`, `note`, `date`, `sets`, `feeling`.

### DELETE /entries/{id}

### GET /followed

### POST /followed
Body:
```json
{ "challengeId": "..." }
```

### DELETE /followed/{id}
Accepts either a `challengeId` (unfollow that challenge) or a `followedChallenges` document id.

### GET /public/challenges (no auth required)

### GET /leaderboard (no auth required)
Returns public challenges sorted by follower count.

## DTOs

### ChallengeDTO (v1 response)

```typescript
interface ChallengeDTO {
  id: string;           // Note: "id" not "_id"
  userId: string;
  name: string;
  targetNumber: number;
  year: number;
  color: string;
  icon: string;
  timeframeUnit: "year" | "month" | "custom";
  startDate?: string;
  endDate?: string;
  isPublic: boolean;
  archived: boolean;
  createdAt: number;
}
```

### EntryDTO (v1 response)

```typescript
interface EntryDTO {
  id: string;           // Note: "id" not "_id"
  userId: string;
  challengeId: string;
  date: string;         // YYYY-MM-DD
  count: number;
  note?: string;
  sets?: { reps: number }[];
  feeling?: "very-easy" | "easy" | "moderate" | "hard" | "very-hard";
  createdAt: number;
}
```

### FollowedChallengeDTO (v1 response)

```typescript
interface FollowedChallengeDTO {
  id: string;           // Note: "id" not "_id"
  userId: string;
  challengeId: string;
  followedAt: number;
}
```
