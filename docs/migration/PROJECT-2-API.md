# PROJECT 2: Shared API Layer

## Overview
**Goal**: Create HTTP endpoints and documentation for mobile app integration with the Convex backend.

**Duration**: 3-4 days  
**Priority**: HIGH - Required before iOS and Android development  
**Dependencies**: Project 1 must be 100% complete

---

## TODO List

> ⚠️ **IMPORTANT**: Do not check off any item until it has been **tested and verified working**. Run the verification steps for each task before marking complete.

### Task 2.1: Convex HTTP Actions
- [x] Create HTTP router
  - [x] Create convex/http.ts
  - [x] Configure httpRouter
  - [x] Verify: File compiles without errors
- [x] Create auth endpoint
  - [x] Add POST /api/auth/user route
  - [ ] Verify: Endpoint returns userId
- [x] Create challenges endpoints
  - [x] Add GET /api/challenges route
  - [x] Add POST /api/challenges route
  - [x] Add PATCH /api/challenges/:id route
  - [ ] Verify: All challenge operations work via curl
- [x] Create entries endpoints
  - [x] Add GET /api/entries route
  - [x] Add POST /api/entries route
  - [x] Add PATCH /api/entries/:id route
  - [x] Add DELETE /api/entries/:id route
  - [ ] Verify: All entry operations work via curl
- [x] Create followed challenges endpoints
  - [x] Add GET /api/followed route
  - [x] Add POST /api/followed route
  - [x] Add DELETE /api/followed/:id route
  - [ ] Verify: Follow/unfollow works via curl
- [x] Create public endpoints
  - [x] Add GET /api/public/challenges route
  - [x] Add GET /api/leaderboard route
  - [x] Verify: Public data accessible without auth
- [x] Enable CORS
  - [x] Add CORS headers to all responses
  - [x] Verify: Mobile apps can make requests
- [ ] **VERIFICATION**: All HTTP endpoints working
  - [ ] Test each endpoint with curl
  - [ ] Verify error responses have correct status codes
  - [ ] Verify auth token validation works

### Task 2.2: API Documentation
- [x] Create API reference document
  - [x] Document base URLs (dev/prod)
  - [x] Document authentication method
  - [x] Verify: All endpoints listed
- [ ] Document user endpoints
  - [ ] POST /api/auth/user - request/response format
  - [ ] Verify: Example works when tested
- [ ] Document challenge endpoints
  - [ ] GET /api/challenges - params and response
  - [ ] POST /api/challenges - request body format
  - [ ] PATCH /api/challenges/:id - update fields
  - [ ] Verify: All examples work
- [ ] Document entry endpoints
  - [ ] GET /api/entries - query params
  - [ ] POST /api/entries - request body
  - [ ] PATCH /api/entries/:id - update fields
  - [ ] DELETE /api/entries/:id - response
  - [ ] Verify: All examples work
- [ ] Document error responses
  - [ ] List all error codes
  - [ ] Document error response format
  - [ ] Verify: Errors match documentation
- [ ] **VERIFICATION**: Documentation complete and accurate
  - [ ] Every endpoint documented
  - [ ] Every example tested and working
  - [ ] Mobile team can use docs to implement

### Task 2.3: Shared Types Package
- [x] Create types package
  - [x] Create packages/shared-types/ directory
  - [x] Set up package.json
  - [x] Verify: Package structure correct
- [x] Define TypeScript types
  - [x] Export TimeframeUnit type
  - [x] Export FeelingType type
  - [x] Export Challenge interface
  - [x] Export Entry interface
  - [x] Export User interface
  - [x] Verify: Types compile without errors
- [x] Create JSON Schema (for non-TypeScript)
  - [x] Create schema.json with all types
  - [ ] Verify: Schema validates sample data
- [x] Document type usage
  - [x] Add README to types package
  - [ ] Include usage examples
  - [ ] Verify: Examples work
- [ ] **VERIFICATION**: Types package usable
  - [ ] Can import types in Next.js project
  - [ ] Types match Convex schema exactly

---

## Project 2 Completion Checklist

**Do not check these until ALL sub-tasks above are complete and verified:**

- [ ] All HTTP endpoints deployed and accessible
- [ ] All CRUD operations available via HTTP
- [ ] CORS configured for mobile access
- [ ] API documentation complete and accurate
- [ ] Shared types package created
- [ ] All endpoints tested with curl
- [ ] Error handling documented

---

## Implementation Notes (Repo)

The repository implementation (as of 2026-01-09) differs slightly from the initial draft below:

- **HTTP base URL**: Convex HTTP routes are served from `https://<deployment>.convex.site` (not `.convex.cloud`).
  - Prod: `https://bright-jackal-396.convex.site`
- **Auth model**: authenticated endpoints derive `userId` from the **Clerk JWT** via `ctx.auth.getUserIdentity()`.
  - Clients **do not send `userId`** (prevents userId spoofing).
- **CORS**: implemented via a single `OPTIONS` route using `pathPrefix: "/api/"`.
- **Routes with IDs** use path prefixes:
  - `PATCH /api/challenges/{id}`
  - `PATCH /api/entries/{id}`
  - `DELETE /api/entries/{id}`
  - `DELETE /api/followed/{id}` (accepts either `challengeId` or `followedChallenges` doc id)

Quick verification already performed:

```bash
curl -i https://tally-tracker.app/
curl https://bright-jackal-396.convex.site/api/public/challenges
curl -X OPTIONS -i https://bright-jackal-396.convex.site/api/public/challenges
curl -i https://bright-jackal-396.convex.site/api/challenges  # 401 without JWT
```

To fully verify authenticated CRUD via curl, obtain a Clerk JWT from the web app session and call the endpoints with:

```
Authorization: Bearer <clerk-jwt>
```

---

## Detailed Implementation

### Step 2.1.1: HTTP Router

Create `convex/http.ts`:
```typescript
import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// CORS headers helper
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle preflight requests
http.route({
  path: "/api/:path*",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
  }),
});

// Auth endpoint
http.route({
  path: "/api/auth/user",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const { clerkId, email, name, avatarUrl } = await request.json();
      
      if (!clerkId) {
        return new Response(JSON.stringify({ error: "clerkId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const userId = await ctx.runMutation(api.users.getOrCreate, {
        clerkId,
        email,
        name,
        avatarUrl,
      });
      
      return new Response(JSON.stringify({ userId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// Get challenges for user
http.route({
  path: "/api/challenges",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const userId = url.searchParams.get("userId");
      const activeOnly = url.searchParams.get("active") === "true";
      
      if (!userId) {
        return new Response(JSON.stringify({ error: "userId is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const challenges = activeOnly
        ? await ctx.runQuery(api.challenges.listActive, { userId: userId as any })
        : await ctx.runQuery(api.challenges.list, { userId: userId as any });
      
      return new Response(JSON.stringify(challenges), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// Create challenge
http.route({
  path: "/api/challenges",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const data = await request.json();
      
      // Validate required fields
      const required = ["userId", "name", "targetNumber", "year", "color", "icon", "timeframeUnit"];
      for (const field of required) {
        if (data[field] === undefined) {
          return new Response(JSON.stringify({ error: `${field} is required` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      
      const id = await ctx.runMutation(api.challenges.create, {
        ...data,
        isPublic: data.isPublic ?? false,
      });
      
      return new Response(JSON.stringify({ id }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// Get entries for challenge
http.route({
  path: "/api/entries",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const challengeId = url.searchParams.get("challengeId");
      const userId = url.searchParams.get("userId");
      const date = url.searchParams.get("date");
      
      let entries;
      
      if (challengeId) {
        entries = await ctx.runQuery(api.entries.listByChallenge, {
          challengeId: challengeId as any,
        });
      } else if (userId && date) {
        entries = await ctx.runQuery(api.entries.listByUserDate, {
          userId: userId as any,
          date,
        });
      } else if (userId) {
        entries = await ctx.runQuery(api.entries.listByUser, {
          userId: userId as any,
        });
      } else {
        return new Response(
          JSON.stringify({ error: "challengeId or userId is required" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      return new Response(JSON.stringify(entries), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// Create entry
http.route({
  path: "/api/entries",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const data = await request.json();
      
      // Validate required fields
      const required = ["userId", "challengeId", "date", "count"];
      for (const field of required) {
        if (data[field] === undefined) {
          return new Response(JSON.stringify({ error: `${field} is required` }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      
      const id = await ctx.runMutation(api.entries.create, data);
      
      return new Response(JSON.stringify({ id }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// Delete entry
http.route({
  path: "/api/entries",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    try {
      const url = new URL(request.url);
      const id = url.searchParams.get("id");
      
      if (!id) {
        return new Response(JSON.stringify({ error: "id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      await ctx.runMutation(api.entries.remove, { id: id as any });
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

// Public challenges (no auth required)
http.route({
  path: "/api/public/challenges",
  method: "GET",
  handler: httpAction(async (ctx) => {
    try {
      const challenges = await ctx.runQuery(api.challenges.listPublic);
      
      return new Response(JSON.stringify(challenges), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }),
});

export default http;
```

### Step 2.2.1: API Documentation

Create `docs/API.md`:
```markdown
# Tally API Documentation

## Base URL

| Environment | URL |
|-------------|-----|
| Development | `https://your-dev-deployment.convex.site` |
| Production | `https://your-prod-deployment.convex.site` |

## Authentication

All authenticated endpoints require a valid Clerk JWT token in the Authorization header:

```
Authorization: Bearer <clerk-jwt-token>
```

Public endpoints (marked with 🔓) do not require authentication.

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message describing the issue"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request - Missing or invalid parameters |
| 401 | Unauthorized - Invalid or missing auth token |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

---

## Endpoints

### Users

#### POST /api/auth/user
Create or retrieve a user by Clerk ID.

**Request Body:**
```json
{
  "clerkId": "user_2abc123...",
  "email": "user@example.com",
  "name": "John Doe",
  "avatarUrl": "https://..."
}
```

**Response (200):**
```json
{
  "userId": "jd7abc123..."
}
```

---

### Challenges

#### GET /api/challenges
Get all challenges for a user.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | string | Yes | Convex user ID |
| active | boolean | No | If true, only return non-archived challenges |

**Response (200):**
```json
[
  {
    "_id": "jd7...",
    "userId": "jd7...",
    "name": "Push-ups",
    "targetNumber": 10000,
    "year": 2026,
    "color": "#3b82f6",
    "icon": "dumbbell",
    "timeframeUnit": "year",
    "startDate": null,
    "endDate": null,
    "isPublic": true,
    "archived": false,
    "createdAt": 1704067200000
  }
]
```

#### POST /api/challenges
Create a new challenge.

**Request Body:**
```json
{
  "userId": "jd7...",
  "name": "Push-ups",
  "targetNumber": 10000,
  "year": 2026,
  "color": "#3b82f6",
  "icon": "dumbbell",
  "timeframeUnit": "year",
  "startDate": null,
  "endDate": null,
  "isPublic": false
}
```

**Response (201):**
```json
{
  "id": "jd7..."
}
```

---

### Entries

#### GET /api/entries
Get entries by challenge, user, or user+date.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| challengeId | string | * | Get entries for a challenge |
| userId | string | * | Get entries for a user |
| date | string | No | Filter by date (YYYY-MM-DD) |

*At least one of challengeId or userId is required.

**Response (200):**
```json
[
  {
    "_id": "jd7...",
    "userId": "jd7...",
    "challengeId": "jd7...",
    "date": "2026-01-09",
    "count": 50,
    "note": "Morning workout",
    "sets": [{"reps": 20}, {"reps": 15}, {"reps": 15}],
    "feeling": "moderate",
    "createdAt": 1704067200000
  }
]
```

#### POST /api/entries
Create a new entry.

**Request Body:**
```json
{
  "userId": "jd7...",
  "challengeId": "jd7...",
  "date": "2026-01-09",
  "count": 50,
  "note": "Morning workout",
  "sets": [{"reps": 20}, {"reps": 15}, {"reps": 15}],
  "feeling": "moderate"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | string | Yes | Convex user ID |
| challengeId | string | Yes | Convex challenge ID |
| date | string | Yes | Date in YYYY-MM-DD format |
| count | number | Yes | Total count for entry |
| note | string | No | Optional note |
| sets | array | No | Array of {reps: number} |
| feeling | string | No | One of: very-easy, easy, moderate, hard, very-hard |

**Response (201):**
```json
{
  "id": "jd7..."
}
```

#### DELETE /api/entries?id={entryId}
Delete an entry.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Yes | Entry ID to delete |

**Response (200):**
```json
{
  "success": true
}
```

---

### Public Endpoints 🔓

#### GET /api/public/challenges
Get all public challenges (no authentication required).

**Response (200):**
```json
[
  {
    "_id": "jd7...",
    "userId": "jd7...",
    "name": "Marathon Training",
    "targetNumber": 1000,
    "year": 2026,
    "color": "#10b981",
    "icon": "running",
    "timeframeUnit": "year",
    "isPublic": true,
    "archived": false,
    "createdAt": 1704067200000
  }
]
```

---

## Testing with curl

```bash
# Create user
curl -X POST https://your-deployment.convex.site/api/auth/user \
  -H "Content-Type: application/json" \
  -d '{"clerkId": "test123", "email": "test@example.com"}'

# Get challenges
curl "https://your-deployment.convex.site/api/challenges?userId=USER_ID"

# Create entry
curl -X POST https://your-deployment.convex.site/api/entries \
  -H "Content-Type: application/json" \
  -d '{"userId": "...", "challengeId": "...", "date": "2026-01-09", "count": 50}'

# Get public challenges
curl https://your-deployment.convex.site/api/public/challenges
```
```

### Step 2.3.1: Shared Types Package

Create `packages/shared-types/package.json`:
```json
{
  "name": "@tally/shared-types",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "prepublish": "npm run build"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

Create `packages/shared-types/src/index.ts`:
```typescript
// Enums
export type TimeframeUnit = "year" | "month" | "custom";
export type FeelingType = "very-easy" | "easy" | "moderate" | "hard" | "very-hard";

// Interfaces
export interface User {
  _id: string;
  clerkId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  createdAt: number;
}

export interface Challenge {
  _id: string;
  userId: string;
  name: string;
  targetNumber: number;
  year: number;
  color: string;
  icon: string;
  timeframeUnit: TimeframeUnit;
  startDate?: string;
  endDate?: string;
  isPublic: boolean;
  archived: boolean;
  createdAt: number;
}

export interface EntrySet {
  reps: number;
}

export interface Entry {
  _id: string;
  userId: string;
  challengeId: string;
  date: string;
  count: number;
  note?: string;
  sets?: EntrySet[];
  feeling?: FeelingType;
  createdAt: number;
}

export interface FollowedChallenge {
  _id: string;
  userId: string;
  challengeId: string;
  followedAt: number;
}

// Request types
export interface CreateUserRequest {
  clerkId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

export interface CreateChallengeRequest {
  userId: string;
  name: string;
  targetNumber: number;
  year: number;
  color: string;
  icon: string;
  timeframeUnit: TimeframeUnit;
  startDate?: string;
  endDate?: string;
  isPublic?: boolean;
}

export interface CreateEntryRequest {
  userId: string;
  challengeId: string;
  date: string;
  count: number;
  note?: string;
  sets?: EntrySet[];
  feeling?: FeelingType;
}

// Response types
export interface CreateUserResponse {
  userId: string;
}

export interface CreateChallengeResponse {
  id: string;
}

export interface CreateEntryResponse {
  id: string;
}

export interface ErrorResponse {
  error: string;
}
```

---

## Verification Commands

```bash
# Deploy HTTP routes
npx convex deploy

# Test auth endpoint
curl -X POST https://YOUR_DEPLOYMENT.convex.site/api/auth/user \
  -H "Content-Type: application/json" \
  -d '{"clerkId": "test_user_123", "email": "test@example.com"}'
# Expected: {"userId": "jd7..."}

# Test get challenges (replace USER_ID with actual ID)
curl "https://YOUR_DEPLOYMENT.convex.site/api/challenges?userId=USER_ID"
# Expected: Array of challenges

# Test create entry
curl -X POST https://YOUR_DEPLOYMENT.convex.site/api/entries \
  -H "Content-Type: application/json" \
  -d '{"userId": "USER_ID", "challengeId": "CHALLENGE_ID", "date": "2026-01-09", "count": 25}'
# Expected: {"id": "jd7..."}

# Test public challenges
curl https://YOUR_DEPLOYMENT.convex.site/api/public/challenges
# Expected: Array of public challenges

# Test error handling
curl -X POST https://YOUR_DEPLOYMENT.convex.site/api/entries \
  -H "Content-Type: application/json" \
  -d '{}'
# Expected: {"error": "userId is required"} with status 400
```
