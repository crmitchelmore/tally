# Tally Web - Next.js + Vercel + Convex + Clerk

Modern web application for tracking challenges and goals with tally marks.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Database**: Convex (real-time, serverless)
- **Authentication**: Clerk
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Language**: TypeScript

## Getting Started

### 1. Set up Convex

```bash
npx convex dev
```

This will:
- Create a Convex project (select "Start without an account" for local dev)
- Generate types in `convex/_generated/`
- Give you a `NEXT_PUBLIC_CONVEX_URL`

### 2. Set up Clerk

1. Create an account at [clerk.com](https://clerk.com)
2. Create a new application
3. Get your keys from the API Keys section:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### 3. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud
```

> Note: this repo also supports a single root `.env` (gitignored) for shared secrets; `next.config.ts` loads it for local dev.

### 4. Run the Development Server

```bash
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
tally-web/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   └── tally/           # Tally-specific components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── providers/           # React context providers
│   └── types/               # TypeScript types
├── convex/                  # Convex backend functions
│   ├── schema.ts            # Database schema
│   ├── users.ts             # User queries/mutations
│   ├── challenges.ts        # Challenge queries/mutations
│   ├── entries.ts           # Entry queries/mutations
│   └── followedChallenges.ts
└── public/                  # Static assets
```

## Database Schema

### Tables

- **users**: Clerk user sync with avatar, name, email
- **challenges**: User challenges with targets, colors, timeframes
- **entries**: Daily rep entries with counts, notes, feelings
- **followedChallenges**: Social following relationships

## Scripts

```bash
bun run dev      # Start development server
bun run build    # Build for production
bun run lint     # Run ESLint
bunx tsc --noEmit # Type check
bunx convex dev   # Start Convex development
```

## Components

### Core UI (shadcn/ui)
46 pre-installed components including Button, Card, Dialog, Sheet, Form, Calendar, etc.

### Tally Components
- `TallyMarks` - Animated tally mark visualization
- `CircularProgress` - Circular progress ring
- `HeatmapCalendar` - GitHub-style activity heatmap
- `ChallengeCard` - Challenge overview card with stats

## Deploy on Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

See [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for details.
