# Tally Web App - Features & Flows Documentation

> Comprehensive documentation of all features, user flows, data models, and API endpoints in the Tally web application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Pages & Routes](#pages--routes)
3. [Core Features](#core-features)
4. [Data Models](#data-models)
5. [API Endpoints](#api-endpoints)
6. [Components Library](#components-library)
7. [User Flows](#user-flows)
8. [Offline Support](#offline-support)

---

## Architecture Overview

### Tech Stack
- **Framework:** Next.js 15 (App Router) with TypeScript
- **Package Manager:** Bun (enforced via preinstall hook)
- **Database:** Convex (real-time database with functions)
- **Authentication:** Clerk
- **Hosting:** Vercel
- **DNS:** Cloudflare

### Convex Integration
- API routes call Convex using `ConvexHttpClient` (`src/app/api/v1/_lib/convex-server.ts`).
- Client components use `ConvexReactClient` via `ConvexClientProvider` (`src/lib/convex.tsx`).
- `NEXT_PUBLIC_CONVEX_URL` must be set for both API routes and client provider.
- After modifying `convex/schema.ts` or `convex/*.ts`, run `npx convex deploy` (Convex deploys separately from Vercel).

### Key Directories
```
tally-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/v1/            # REST API endpoints
│   │   ├── app/               # Authenticated app pages
│   │   ├── offline/           # Offline-first mode
│   │   └── (auth)/            # Sign-in/sign-up pages
│   ├── components/            # React components
│   │   ├── challenges/        # Challenge-related
│   │   ├── entries/           # Entry management
│   │   ├── stats/             # Dashboard & analytics
│   │   ├── data/              # Export/import/clear
│   │   ├── community/         # Public challenges
│   │   ├── settings/          # Settings components
│   │   ├── ui/                # Core UI components
│   │   └── landing/           # Marketing page
│   ├── hooks/                 # Custom React hooks
│   └── lib/                   # Utility functions
└── convex/                    # Convex schema & functions
```

---

## Pages & Routes

### Public Pages
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `page.tsx` | Landing page with hero, features, testimonials |
| `/sign-in` | Clerk | Authentication - sign in |
| `/sign-up` | Clerk | Authentication - sign up |
| `/ios` | `ios/page.tsx` | iOS app download page |
| `/android` | `android/page.tsx` | Android app download page |

### Authenticated Pages
| Route | Component | Description |
|-------|-----------|-------------|
| `/app` | `app/page.tsx` | Main dashboard |
| `/app/challenges/[id]` | `challenges/[id]/page.tsx` | Challenge detail view |
| `/app/community` | `community/page.tsx` | Public challenges browser |
| `/app/settings` | `settings/page.tsx` | User settings & data management |

### Offline Mode
| Route | Component | Description |
|-------|-----------|-------------|
| `/offline` | `offline/page.tsx` | Offline-first experience (localStorage) |

---

## Core Features

### 1. Challenges

**Purpose:** Create and track progress toward goals.

**Capabilities:**
- Create challenge with name, target, timeframe, color, icon
- Configure count type: simple, sets, or custom
- Set unit labels (reps, minutes, pages, etc.)
- Toggle public/private visibility
- Archive/unarchive challenges
- Soft-delete with undo support

**Timeframe Types:**
- `year` - Full calendar year
- `month` - Current month
- `custom` - User-defined start/end dates

**Count Types:**
- `simple` - Single count value
- `sets` - Array of rep counts per set (e.g., [20, 15, 12])
- `custom` - User-defined increments

### 2. Entries

**Purpose:** Log progress against challenges.

**Capabilities:**
- Add entry with count or sets breakdown
- Optional note and feeling (great/good/okay/tough)
- Date selection (no future dates allowed)
- Edit existing entries
- Delete with undo support
- View entries by day via heatmap drilldown

**Sets Mode:**
- Smart defaults: initial value = 2-week average
- When adding sets: new set starts at previous set's value
- Visual: card-based UI with -100/-10/-1/+1/+10/+100 buttons

### 3. Dashboard Statistics

**Components:**
- **Dashboard Highlights:** Total marks, today's count, best streak, pace status
- **Personal Records:** Best single day, longest streak, highest average, biggest entry, best set
- **Progress Graph:** Multi-challenge line chart with filters
- **Burn-Up Chart:** Cumulative progress vs. target line
- **Weekly Summary:** Modal with week-by-week breakdown

**Configurable Panels:**
User can show/hide:
- Highlights
- Personal Records  
- Progress Graph
- Burn-Up Chart
- Sets Stats

Configuration stored in localStorage and synced via `/api/v1/auth/user/preferences`.

### 4. Activity Heatmap

**Purpose:** Visual calendar showing daily activity intensity.

**Features:**
- Year view with color-coded intensity
- Click day to open drilldown
- Shows entries for selected day
- Quick actions: edit, delete, add entry

### 5. Community

**Public Challenges:**
- Browse all public challenges
- Search by name
- View progress, follower count, owner
- Follow/unfollow with optimistic updates

**Followed Challenges:**
- Section on main dashboard
- Shows progress of followed challenges

### 6. Data Management

**Export:**
- JSON format with all challenges and entries
- Includes sets data, notes, feelings
- Dashboard config is stored in localStorage and synced via preferences (not included in API export)
- Filename: `tally-export-YYYY-MM-DD.json`

**Import:**
- Upload JSON file
- Validates structure
- Replace-all semantics
- Error reporting for invalid data
- Dashboard config is not imported (stored locally)

**Clear All:**
- Confirmation required
- Removes all challenges, entries, follows
- Irreversible action

### 7. Settings

**Sections:**
- **Account:** Profile info, sign out
- **Sessions & Sync:** Active devices
- **Support:** Help links
- **Data Management:** Export, import, clear
- **About:** Version info, links

---

## Data Models

### User
```typescript
interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

### Challenge
```typescript
interface Challenge {
  id: string;
  userId: string;
  name: string;
  target: number;
  timeframeType: "year" | "month" | "custom";
  startDate: string;      // ISO date
  endDate: string;        // ISO date
  color: string;
  icon: string;
  isPublic: boolean;
  isArchived: boolean;
  countType?: "simple" | "sets" | "custom";
  unitLabel?: string;     // e.g., "reps", "minutes"
  defaultIncrement?: number;
  createdAt: string;
  updatedAt: string;
}
```

### Entry
```typescript
interface Entry {
  id: string;
  userId: string;
  challengeId: string;
  date: string;           // YYYY-MM-DD
  count: number;
  sets?: number[];        // e.g., [20, 15, 12]
  note?: string;
  feeling?: "great" | "good" | "okay" | "tough";
  createdAt: string;
  updatedAt: string;
}
```

### Follow
```typescript
interface Follow {
  id: string;
  userId: string;
  challengeId: string;
  createdAt: string;
}
```

### Dashboard Config
```typescript
interface DashboardConfig {
  panels: {
    highlights: boolean;
    personalRecords: boolean;
    progressGraph: boolean;
    burnUpChart: boolean;
    setsStats: boolean;
  };
}
```

### Stats Types
```typescript
interface ChallengeStats {
  challengeId: string;
  totalCount: number;
  remaining: number;
  daysElapsed: number;
  daysRemaining: number;
  perDayRequired: number;
  currentPace: number;
  paceStatus: "ahead" | "on-pace" | "behind";
  streakCurrent: number;
  streakBest: number;
  bestDay: { date: string; count: number } | null;
  dailyAverage: number;
}

interface DashboardStats {
  totalMarks: number;
  today: number;
  bestStreak: number;
  overallPaceStatus: "ahead" | "on-pace" | "behind" | "none";
  bestSet?: { value: number; date: string; challengeId: string };
  avgSetValue?: number;
}

interface PersonalRecords {
  bestSingleDay: { date: string; count: number } | null;
  longestStreak: number;
  highestDailyAverage: { challengeId: string; average: number } | null;
  mostActiveDays: number;
  biggestSingleEntry: { date: string; count: number; challengeId: string } | null;
  bestSet?: { value: number; date: string; challengeId: string };
  avgSetValue?: number;
}
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/auth/user` | Get current user info |
| POST | `/api/v1/auth/user` | Provision user (mobile) |
| GET | `/api/v1/auth/user/preferences` | Get dashboard preferences |
| PATCH | `/api/v1/auth/user/preferences` | Update dashboard preferences |

### Challenges
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/challenges` | List user's challenges |
| POST | `/api/v1/challenges` | Create challenge |
| GET | `/api/v1/challenges/[id]` | Get challenge by ID |
| PATCH | `/api/v1/challenges/[id]` | Update challenge |
| DELETE | `/api/v1/challenges/[id]` | Soft-delete challenge |
| POST | `/api/v1/challenges/[id]/restore` | Restore deleted challenge |
| GET | `/api/v1/challenges/[id]/stats` | Get challenge statistics |

### Entries
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/entries` | List entries (with filters) |
| POST | `/api/v1/entries` | Create entry |
| GET | `/api/v1/entries/[id]` | Get entry by ID |
| PATCH | `/api/v1/entries/[id]` | Update entry |
| DELETE | `/api/v1/entries/[id]` | Soft-delete entry |
| POST | `/api/v1/entries/[id]/restore` | Restore deleted entry |

### Stats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/stats` | Get dashboard stats & records |

### Community
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/public/challenges` | List public challenges |
| GET | `/api/v1/followed` | List followed challenges |
| POST | `/api/v1/follow` | Follow a challenge |
| DELETE | `/api/v1/follow` | Unfollow a challenge |

### Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/data` | Export all user data |
| POST | `/api/v1/data` | Import user data |
| DELETE | `/api/v1/data` | Clear all user data |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/public/health` | Health check (Convex connectivity) |

---

## Components Library

### UI Components (components/ui/)
| Component | Purpose |
|-----------|---------|
| `TallyMark` | Single tally mark (1-5) |
| `TallyDisplay` | Full tally visualization (any count) |
| `TallyAnimated` | Animated tally for success feedback |
| `AppHeader` | Top navigation bar |
| `AppNav` | Bottom/side navigation |
| `ThemeToggle` | Light/dark mode switch |
| `SyncIndicator` | Online/offline status |
| `UndoToast` | Undo action notification |
| `UserMenu` | User dropdown menu |

### Challenge Components (components/challenges/)
| Component | Purpose |
|-----------|---------|
| `ChallengeCard` | Dashboard card with progress ring |
| `ChallengeList` | Grid of challenge cards |
| `CreateChallengeDialog` | New challenge modal |
| `ActivityHeatmap` | Year calendar with intensity |

### Entry Components (components/entries/)
| Component | Purpose |
|-----------|---------|
| `AddEntryDialog` | Add new entry modal |
| `EditEntryDialog` | Edit existing entry modal |
| `EntryList` | Paginated list of entries |
| `DayDrilldown` | Entries for specific day |

### Stats Components (components/stats/)
| Component | Purpose |
|-----------|---------|
| `DashboardHighlights` | Quick stats overview |
| `PersonalRecords` | Achievement records |
| `WeeklySummary` | Week-by-week modal |
| `ProgressGraph` | Multi-line chart |
| `BurnUpChart` | Cumulative vs target |

### Data Components (components/data/)
| Component | Purpose |
|-----------|---------|
| `ExportData` | Download JSON export |
| `ImportData` | Upload and validate import |
| `ClearData` | Delete all data with confirm |

### Community Components (components/community/)
| Component | Purpose |
|-----------|---------|
| `CommunitySection` | Dashboard community area |
| `PublicChallengeCard` | Public challenge display |
| `PublicChallengesList` | Grid of public challenges |
| `FollowedChallengesSection` | Followed challenges area |

---

## User Flows

### 1. New User Onboarding
```
Landing Page -> Sign Up -> Dashboard (empty) -> Create First Challenge -> Add Entry -> View Progress
```

### 2. Daily Entry Flow
```
Dashboard -> Click Challenge Card "+" -> Add Entry Dialog -> 
Select count/sets -> Optional note/feeling -> Submit -> 
View updated stats + tally animation
```

### 3. Challenge Creation Flow
```
Dashboard -> "New Challenge" -> Create Dialog ->
Enter name, target, timeframe -> Select color/icon ->
Configure count type (simple/sets) -> Toggle public ->
Submit -> View in dashboard
```

### 4. Edit Entry Flow
```
Challenge Detail -> Recent Entries -> Click entry ->
Edit Dialog (same UI as Add) -> Modify values ->
Submit -> Refreshed stats
```

### 5. Heatmap Drilldown Flow
```
Challenge Detail -> Activity Heatmap -> Click day cell ->
Day Drilldown modal -> View/edit/delete entries ->
Or add new entry for that day
```

### 6. Community Discovery Flow
```
Dashboard -> Community Section -> "View All" ->
Community Page -> Search challenges ->
Follow challenge -> View in "Following" section
```

### 7. Data Export Flow
```
Settings -> Data Management -> Export ->
Download JSON file -> Contains all challenges, entries, config
```

### 8. Data Import Flow
```
Settings -> Data Management -> Import ->
Select JSON file -> Validate -> Preview ->
Confirm replace -> All data updated
```

---

## Offline Support

### Offline Mode (/offline)
- Fully functional without authentication
- Data stored in localStorage
- Same UI components as main app
- Export backup available
- Prompt to sign in for sync

### Storage Keys
```
tally_offline_challenges  - Challenge array
tally_offline_entries     - Entry array
tally_offline_user        - Offline flag
dashboardConfig           - Panel visibility (cached, synced)
```

### Sync Behavior
- Online: REST API backed by Convex
- Offline: localStorage only (no automatic sync)
- Visual indicator shows offline state

---

## Design Philosophy Applied

Every feature follows these principles:

1. **Tactile:** Immediate feedback, tally-mark animations
2. **Focused:** Minimal UI, primary actions prominent
3. **Honest:** Real counts, no gamification gimmicks
4. **Friendly:** Subtle motion, reduced-motion support
5. **Accessible:** High contrast, large tap targets
6. **Offline-first:** Clear sync states, local fallbacks

---

## Related Documentation

- [Design Philosophy](../DESIGN-PHILOSOPHY.md)
- [Tech Stack Requirements](../tech-stack-requirements.md)
- [API Contract](../plans/web-api/feature-api-contract.md)
- [iOS Plan](../plans/ios/)
- [Android Plan](../plans/android/)
