# Tally API v1 Reference

> Complete REST API documentation for the Tally backend.

## Base URL
```
Production: https://tally-tracker.app/api/v1
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <clerk_jwt_token>
```

Public endpoints under `/api/v1/public/` do not require authentication (currently only `/api/v1/public/health`).

## Error Responses

All errors return JSON with the following structure:
```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { "field": "Specific field error" }
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Endpoints

### Authentication

#### GET /api/v1/auth/user
Get the current authenticated user.

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "clerkId": "clerk_abc",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

#### POST /api/v1/auth/user
Provision the authenticated user (used by mobile). Creates or updates the user record.

**Response:**
```json
{
  "user": {
    "id": "user_123",
    "clerkId": "clerk_abc",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-15T12:00:00Z"
  }
}
```

#### GET /api/v1/auth/user/preferences
Get user preferences (dashboard configuration).

**Response:**
```json
{
  "dashboardConfig": {
    "panels": {
      "highlights": true,
      "personalRecords": true,
      "progressGraph": true,
      "burnUpChart": true,
      "setsStats": true
    }
  }
}
```

#### PATCH /api/v1/auth/user/preferences
Update user preferences.

**Request Body:**
```json
{
  "dashboardConfig": {
    "panels": {
      "highlights": true,
      "personalRecords": true,
      "progressGraph": true,
      "burnUpChart": true,
      "setsStats": true
    }
  }
}
```

**Response:** same as GET.

### Challenges

#### GET /api/v1/challenges
List all challenges for the authenticated user.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `includeArchived` | boolean | Include archived challenges (default: false) |

**Response:**
```json
{
  "challenges": [
    {
      "challenge": {
        "id": "ch_123",
        "userId": "user_123",
        "name": "100 Pushups",
        "target": 10000,
        "timeframeType": "year",
        "startDate": "2024-01-01",
        "endDate": "2024-12-31",
        "color": "#E53E3E",
        "icon": "fitness",
        "isPublic": false,
        "isArchived": false,
        "countType": "sets",
        "unitLabel": "reps",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-15T12:00:00Z"
      },
      "stats": {
        "challengeId": "ch_123",
        "totalCount": 2500,
        "remaining": 7500,
        "daysElapsed": 45,
        "daysRemaining": 320,
        "perDayRequired": 23.4,
        "currentPace": 55.6,
        "paceStatus": "ahead",
        "streakCurrent": 7,
        "streakBest": 14,
        "bestDay": { "date": "2024-01-10", "count": 150 },
        "dailyAverage": 55.6
      }
    }
  ]
}
```

#### POST /api/v1/challenges
Create a new challenge.

**Request Body:**
```json
{
  "name": "100 Pushups",
  "target": 10000,
  "timeframeType": "year",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "color": "#E53E3E",
  "icon": "fitness",
  "isPublic": false,
  "countType": "sets",
  "unitLabel": "reps"
}
```

**Required Fields:** `name`, `target`, `timeframeType`

**Response:** `201 Created`
```json
{
  "challenge": { ... }
}
```

#### GET /api/v1/challenges/:id
Get a specific challenge.

**Response:**
```json
{
  "challenge": { ... }
}
```

#### PATCH /api/v1/challenges/:id
Update a challenge.

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "target": 15000,
  "color": "#3182CE",
  "icon": "sports",
  "isPublic": true,
  "isArchived": false
}
```

**Response:**
```json
{
  "challenge": { ... }
}
```

#### DELETE /api/v1/challenges/:id
Soft-delete a challenge.

**Response:**
```json
{
  "success": true,
  "id": "ch_123",
  "deletedAt": 1715798400000
}
```

#### POST /api/v1/challenges/:id/restore
Restore a soft-deleted challenge.

**Response:**
```json
{
  "success": true,
  "challenge": { ... }
}
```

#### GET /api/v1/challenges/:id/stats
Get detailed statistics for a challenge.

**Response:**
```json
{
  "dashboard": {
    "challengeId": "ch_123",
    "totalCount": 2500,
    "remaining": 7500,
    "daysElapsed": 45,
    "daysRemaining": 320,
    "perDayRequired": 23.4,
    "currentPace": 55.6,
    "paceStatus": "ahead",
    "streakCurrent": 7,
    "streakBest": 14,
    "bestDay": { "date": "2024-01-10", "count": 150 },
    "dailyAverage": 55.6
  },
  "records": { ... }
}
```

---

### Entries

#### GET /api/v1/entries
List entries for the authenticated user.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `challengeId` | string | Filter by challenge |
| `date` | string | Filter by date (YYYY-MM-DD) |

**Response:**
```json
{
  "entries": [
    {
      "id": "ent_123",
      "userId": "user_123",
      "challengeId": "ch_123",
      "date": "2024-01-15",
      "count": 47,
      "sets": [20, 15, 12],
      "note": "Morning workout",
      "feeling": "great",
      "createdAt": "2024-01-15T08:00:00Z",
      "updatedAt": "2024-01-15T08:00:00Z"
    }
  ]
}
```

#### POST /api/v1/entries
Create a new entry.

**Request Body:**
```json
{
  "challengeId": "ch_123",
  "date": "2024-01-15",
  "count": 47,
  "sets": [20, 15, 12],
  "note": "Morning workout",
  "feeling": "great"
}
```

**Required Fields:** `challengeId`, `date`, `count`

**Notes:**
- `date` cannot be in the future
- If `sets` is provided, `count` should equal sum of sets
- `feeling` must be one of: "great", "good", "okay", "tough"

**Response:** `201 Created`
```json
{
  "entry": { ... }
}
```

#### GET /api/v1/entries/:id
Get a specific entry.

**Response:**
```json
{
  "entry": { ... }
}
```

#### PATCH /api/v1/entries/:id
Update an entry.

**Request Body:** (all fields optional)
```json
{
  "date": "2024-01-14",
  "count": 50,
  "sets": [25, 15, 10],
  "note": "Updated note",
  "feeling": "good"
}
```

**Response:**
```json
{
  "entry": { ... }
}
```

#### DELETE /api/v1/entries/:id
Soft-delete an entry.

**Response:**
```json
{
  "success": true,
  "id": "ent_123",
  "deletedAt": 1715798400000
}
```

#### POST /api/v1/entries/:id/restore
Restore a soft-deleted entry.

**Response:**
```json
{
  "success": true,
  "entry": { ... }
}
```

---

### Stats

#### GET /api/v1/stats
Get dashboard statistics and personal records.

**Response:**
```json
{
  "dashboard": {
    "totalMarks": 15000,
    "today": 47,
    "bestStreak": 21,
    "overallPaceStatus": "ahead",
    "bestSet": { "value": 35, "date": "2024-01-10", "challengeId": "ch_123" },
    "avgSetValue": 18.5
  },
  "records": {
    "bestSingleDay": { "date": "2024-01-10", "count": 200 },
    "longestStreak": 21,
    "highestDailyAverage": { "challengeId": "ch_123", "average": 55.6 },
    "mostActiveDays": 45,
    "biggestSingleEntry": { "date": "2024-01-05", "count": 150, "challengeId": "ch_123" },
    "bestSet": { "value": 35, "date": "2024-01-10", "challengeId": "ch_123" },
    "avgSetValue": 18.5
  }
}
```

---

### Community

#### GET /api/v1/public/challenges
List all public challenges. Requires authentication (uses follow state).

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string | Search by name |

**Response:**
```json
{
  "challenges": [
    {
      "id": "ch_456",
      "name": "Community Fitness",
      "target": 50000,
      "icon": "fitness",
      "color": "#3182CE",
      "totalReps": 25000,
      "progress": 50,
      "followerCount": 42,
      "isFollowing": true,
      "isOwner": false,
      "owner": {
        "id": "user_789",
        "name": "Jane Doe"
      }
    }
  ]
}
```

#### GET /api/v1/followed
List challenges the user is following.

**Response:**
```json
{
  "challenges": [
    {
      "id": "ch_456",
      "name": "Community Fitness",
      "target": 50000,
      "totalReps": 25000,
      "progress": 50,
      "owner": { "id": "user_789", "name": "Jane Doe" }
    }
  ]
}
```


#### POST /api/v1/follow
Follow a challenge.

**Request Body:**
```json
{
  "challengeId": "ch_456"
}
```

**Response:** `201 Created`
```json
{
  "success": true
}
```

#### DELETE /api/v1/follow
Unfollow a challenge.

**Request Body:**
```json
{
  "challengeId": "ch_456"
}
```

**Response:**
```json
{
  "success": true,
  "removed": true
}
```

---

### Data Management

#### GET /api/v1/data
Export all user data.

**Response:**
```json
{
  "version": "1.0",
  "exportedAt": "2024-01-15T12:00:00Z",
  "challenges": [ ... ],
  "entries": [ ... ]
}
```

#### POST /api/v1/data
Import user data. Replaces all existing data.

**Request Body:**
```json
{
  "version": "1.0",
  "challenges": [ ... ],
  "entries": [ ... ]
}
```

**Response:**
```json
{
  "success": true,
  "imported": {
    "challenges": 5,
    "entries": 150
  }
}
```

#### DELETE /api/v1/data
Clear all user data.

**Response:**
```json
{
  "success": true,
  "deleted": {
    "challenges": 5,
    "entries": 150,
    "follows": 2
  }
}
```

---

### Health

#### GET /api/v1/public/health
Health check endpoint. No authentication required.

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "clerk_secret_key": true,
    "convex_url": true,
    "convex_connected": true
  },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

---

## Rate Limits, Pagination, Sorting

Not currently enforced in API routes.
