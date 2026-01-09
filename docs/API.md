# Tally API

Convex HTTP endpoints for mobile + integrations.

## Base URL

HTTP API base URL:

- Dev: `https://<your-dev-deployment>.convex.site`
- Prod: `https://bright-jackal-396.convex.site`

Note: the Convex React client uses `NEXT_PUBLIC_CONVEX_URL` (typically `https://<deployment>.convex.cloud`), but HTTP routes are served from `.convex.site`.

## Authentication

Authenticated endpoints require a Clerk JWT in the Authorization header:

```
Authorization: Bearer <clerk-jwt>
```

## Error format

```json
{ "error": "message" }
```

## Endpoints

### POST /api/auth/user
Returns the Convex `userId` for the authenticated Clerk user (creates it if missing).

Response:
```json
{ "userId": "...", "clerkId": "..." }
```

### GET /api/challenges
Query params:
- `active=true` (optional)

### POST /api/challenges
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

### PATCH /api/challenges/{id}
Body supports optional fields: `name`, `targetNumber`, `color`, `icon`, `isPublic`, `archived`.

### GET /api/entries
Query params:
- `challengeId=<challengeId>` (optional)
- `date=YYYY-MM-DD` (optional; only used when `challengeId` is omitted)

### POST /api/entries
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

### PATCH /api/entries/{id}
Body supports optional fields: `count`, `note`, `date`, `sets`, `feeling`.

### DELETE /api/entries/{id}

### GET /api/followed

### POST /api/followed
Body:
```json
{ "challengeId": "..." }
```

### DELETE /api/followed/{id}
Accepts either a `challengeId` (unfollow that challenge) or a `followedChallenges` document id.

### GET /api/public/challenges (public)

### GET /api/leaderboard (public)
Returns public challenges sorted by follower count.
