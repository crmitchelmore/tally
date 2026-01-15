# Planning Guide

Tally - A tactile, satisfying progress tracker inspired by traditional tally marks. Count what matters with the timeless method of marking progress - four vertical lines crossed by a fifth. Track ambitious annual goals with a hand-crafted aesthetic that makes every mark feel meaningful.

**Experience Qualities**:
1. **Tactile** - Every interaction should feel like making a physical mark on paper - deliberate, satisfying, and permanent with visual feedback inspired by pen strokes and counting marks
2. **Focused** - Clean, minimal interface that puts the numbers front and center, avoiding distractions while celebrating the simple act of counting progress
3. **Honest** - Raw, authentic progress visualization that shows exactly where you are without gamification gimmicks - just you versus your goal

## Motivation (why we’re building Tally)

People want to track what matters, but everyone’s journey is different.

- Some people want to do a **consistent amount every day**.
- Some people want consistency but **don’t want to feel pressured** to hit it *every* day.
- Some people prefer to **batch** (do more on one day, rest on others).
- Some people like to **get ahead of the target** (build a buffer) and then coast.

Tally should support all of these without judgment:
- Track progress toward a target and show pace **without “punishing” missed days**.
- Make it easy to see when you’re **ahead / on pace / behind**, and how much is needed to catch up.
- Celebrate momentum and progress, not perfection.

**Complexity Level**: Light Application (multiple features with basic state)
  - Core features include challenge creation, daily entry logging, progress visualization with heatmaps and charts, and pace calculation - all manageable with client-side state management using Spark's KV storage

## Essential Features

**User Authentication & Data Isolation**
- Functionality: Authenticate users via GitHub and ensure complete data isolation between users with a dedicated login page
- Purpose: Protect user privacy by ensuring each user can only see, create, edit, import, export, and delete their own data - no access without authentication
- Trigger: Application loads
- Progression: App loads → Shows login page with GitHub sign-in prompt → User clicks "Sign in with GitHub" → Fetches GitHub user authentication → Retrieves user ID → Transitions to dashboard → All data queries filter by user ID → User sees only their challenges and entries → All data operations automatically tag data with user ID → If authentication fails, user remains on login page with retry option
- Success criteria: Login page gates all access to the app, users cannot see other users' data under any circumstances, all challenges and entries are tagged with userId, all operations (create, read, update, delete, import, export) are scoped to authenticated user only, proper loading states during authentication, clear error messaging if authentication fails, retry mechanism available on login page

**Challenge Creation**
- Functionality: Create a new challenge with name, target number, timeframe (day/month/year), custom date range (optional), custom color, and icon
- Purpose: Allows users to define their ambitious goals with personalization and flexible timeframes (e.g., "30 planks this month" or "100 pushups from March 1st to April 1st")
- Trigger: Click "New Challenge" button or floating + when no challenges exist
- Progression: Click new → Modal opens → Enter name (e.g. "Push-ups") → Set target (10,000) → Choose timeframe (day/month/year default) → Optionally toggle "Custom Date Range" → If custom: select start date and end date (auto-calculates based on timeframe if end date not provided) → Choose year (if not using custom dates) → Pick vibrant color → Select icon from 50+ options → Save → Card appears with 0/10,000 progress
- Success criteria: Challenge persists across sessions, displays with chosen aesthetics and timeframe, calculates daily pace needed based on actual timeframe (custom dates or default year), custom date ranges properly calculate end dates from start + timeframe unit, challenge shows appropriate badge (e.g., "Per Month", "Jan 1 → Jan 31")

**Daily Entry Logging (Most Critical UX)**
- Functionality: Quick-add entries with challenge selection for multiple challenges, large touch targets, presets, and optional notes
- Purpose: Must be faster and more satisfying than any competing app to build daily habit
- Trigger: Tap floating + button (always visible bottom-right)
- Progression: Tap + → Bottom sheet slides up with smooth spring animation → If multiple challenges: scrollable list with color indicators and checkmarks for selection → If single challenge: shows challenge name with color indicator → Huge number input (72px font) → Tap quick presets (+1, +5, +10, +50) or type custom → Optional: expand note field → Tap "Done" → Confetti explosion + haptic feedback → Sheet dismisses → Progress ring animates to new value → Heatmap square fills → Pace recalculates with color change if status improved → Overall stats update
- Success criteria: Can log entry in under 3 seconds, animations feel buttery smooth at 60fps, confetti triggers every time, total updates without page refresh, challenge selection is clear and easy with multiple challenges, auto-selects challenge when only one exists

**Progress Dashboard**
- Functionality: Visual overview of all active challenges with overall summary stats, personal records highlighting best performances, current totals, pace analysis, and heatmaps
- Purpose: Instant motivation boost showing progress across all challenges, celebrating achievements with personal records, and what's needed to stay on track
- Trigger: App loads to dashboard by default
- Progression: User opens app → Overall stats cards appear showing total reps, today's progress, best streak, and challenges ahead of pace → Personal records section displays best performances: best single day, longest streak, highest daily average, most active days, biggest single entry, and fastest to milestone → Grid of challenge cards loads → Each card shows: Colored top border for quick identification → Bold total/target → Timeframe badge (e.g., "Per Day", "Per Month", "Per Year") and optional date range badge (e.g., "Jan 1 → Jan 31") → Thick circular progress ring (animated) → Mini heatmap showing timeframe activity → "Remaining" section with days left, required daily pace (color-coded: green=ahead, gold=on pace, red=behind), and encouraging message → Can scroll through multiple challenges easily
- Success criteria: All data loads instantly from KV storage, personal records accurately track best achievements across all challenges, colors accurately reflect pace status, heatmap renders all days in timeframe without lag, overall stats aggregate across all challenges correctly, grid layout responsive (1 column mobile, 2 tablet, 3 desktop), active challenges filter includes custom date ranges and shows challenges that haven't ended yet

**Challenge Detail View**
- Functionality: Full-screen deep dive into a single challenge with charts, stats, and history
- Purpose: Satisfies user curiosity about patterns and achievements while celebrating milestones
- Trigger: Click anywhere on a challenge card
- Progression: Tap card → Smooth page transition → Large heatmap appears → Scroll to see cumulative line chart (actual vs perfect pace) → Weekly average bar chart → Stats grid (best day, current streak, longest streak, total days active) → List of recent entries with edit/delete options
- Success criteria: Charts render smoothly using Recharts, streak calculations accurate, can navigate back to dashboard

**Pace Intelligence**
- Functionality: Real-time calculation of daily requirement, ahead/behind status, and motivational messaging based on challenge timeframe
- Purpose: Creates positive pressure to maintain consistency and celebrates being ahead
- Trigger: Automatically recalculates after every entry and on dashboard load
- Progression: System calculates: Total remaining → Days left in timeframe (custom date range or default year/month/day) → Required daily pace → Compares actual pace to required → Generates message: "You're 142 reps ahead 🔥" or "Need 8 extra per day this week to catch up"
- Success criteria: Math is always accurate (accounts for custom date ranges, months, leap years), messages feel encouraging not discouraging, color coding is instantly recognizable, works correctly for all timeframe units (day/month/year)

**Heatmap Calendar**
- Functionality: GitHub-style contribution graph showing intensity by day for the challenge's timeframe
- Purpose: Visual streak reinforcement and pattern recognition (user sees gaps immediately)
- Trigger: Displays on every challenge card and detail view
- Progression: Renders grid for challenge timeframe (1 day, ~30 days for month, 365 days for year, or custom range) → Each square colored by intensity (5 levels from light to dark vibrant green) → Hover/tap shows tooltip: "Wed 18 Jun – 87 reps" + note if exists → Click day opens quick view modal with day's entries
- Success criteria: All days in timeframe render quickly, color scale matches aesthetic, tooltips don't lag on mobile, adapts to different timeframe lengths (day/month/year/custom)

**Export/Import Data**
- Functionality: Backup and restore all challenges and entries in JSON or CSV format, with user-scoped data and ability to clear all data. All data operations are scoped to the authenticated GitHub user's ID to ensure complete data isolation between users.
- Purpose: Allow users to maintain data backups, migrate data between devices, recover from data loss, and clean up test/old data. Each user can only access, export, import, and manage their own data.
- Trigger: Click "Backup" button in header
- Progression: Click Backup → Dialog opens → Shows current user's data count (challenges and entries) → Choose Export (JSON/CSV) or Import → For export: file downloads instantly with timestamp and user ID → For import: Warning displays → Select file → All imported data is tagged with current user's ID → Success toast shows count of challenges and entries imported → Danger Zone section allows permanent deletion of user's data with confirmation
- Success criteria: JSON export creates valid parseable file with user ID, CSV export readable in Excel/Sheets with user ID header, Import tags all data with current user ID automatically, proper error handling for invalid files, Clear All Data requires confirmation and permanently deletes only current user's challenges and entries, all data operations are scoped to current user only, users cannot see or access other users' data under any circumstances

**Weekly Summary**
- Functionality: Comprehensive weekly progress report with stats, comparisons, and breakdowns
- Purpose: Help users reflect on their week, see patterns, and stay motivated with progress insights
- Trigger: Click "Weekly Summary" button in header
- Progression: Click button → Dialog opens showing current week → Displays: total reps, daily average, entries logged, active challenges, best day, challenge breakdown, daily chart, comparison to previous week → Navigate between weeks with prev/next arrows → View historical weeks
- Success criteria: Calculations accurate for any week, comparison to previous week shows percentage change, daily breakdown shows visual bars, challenge breakdown sorted by count, navigating weeks updates all stats

**Public/Private Challenge Settings**
- Functionality: Toggle whether a challenge is visible to other users on leaderboards and community challenges, with ability to archive challenges
- Purpose: Give users control over their privacy while enabling community features and competition for those who want it
- Trigger: Click "Settings" button in challenge detail view or toggle public/private during challenge creation
- Progression: In create dialog: Toggle "Public Challenge" switch → Challenge is marked as public/private → In detail view: Click Settings → Toggle public/private → Confirmation toast → Can also archive challenge with confirmation dialog
- Success criteria: Public challenges appear on leaderboards and community page, private challenges only visible to owner, toggle updates immediately, archive moves challenge out of active view, all data preserved

**Leaderboard**
- Functionality: View global and personal rankings based on total reps across all public challenges, with time range filters (week, month, year, all-time)
- Purpose: Enable friendly competition and motivation by seeing how users rank against the community
- Trigger: Click "Leaderboard" button in dashboard header
- Progression: Click Leaderboard → View loads with weekly rankings by default → See ranked list with avatars, usernames, challenge names, total reps, progress %, and days active → Switch between time ranges (week/month/year/all-time) → Switch between Global leaderboard and "My Ranks" tab → Top 3 positions show crown/medal icons → Current user's entries highlighted with border → Click Back to return to dashboard
- Success criteria: Rankings accurately calculated based on total reps in timeframe, filters work correctly, user can see their own rankings separately, real-time updates when new entries added, smooth loading states, empty states for no public challenges

**Public Challenges Browser**
- Functionality: Browse all public challenges from the community with search and filtering capabilities
- Purpose: Discover what others are tracking, get inspiration for new challenges, see community activity
- Trigger: Click "Community" button in dashboard header
- Progression: Click Community → Page loads with grid of all public challenges → See challenge cards with creator avatar, username, challenge details, progress ring, total reps, target, completion %, and daily pace → Search by challenge name or username → Own challenges highlighted with "Your challenge" badge → Click Back to return to dashboard
- Success criteria: All public challenges displayed with accurate stats, search filters results immediately, challenge cards show creator info and progress, user's own public challenges clearly marked, responsive grid layout, loading and empty states handled gracefully

## Edge Case Handling

**Empty States** - First-time users see hero section with "Create your first challenge" CTA instead of empty grid
**No Entries Yet** - Challenge cards show 0/target with heatmap of empty squares and message "Start today!"
**Year Rollover** - Challenges auto-archive when year ends, new year shows option to "Continue this challenge in 2026"
**Offline State** - Entries queue in localStorage, sync when connection returns (with toast notification)
**Invalid Inputs** - Negative numbers rejected, zero target shows error, dates in future disabled
**Deleted Challenges** - Soft delete with 30-day recovery window, then permanent purge
**Multiple Entries Same Day** - Aggregates into single heatmap square, detail view shows all individual entries

## Design Direction

The design should evoke the tactile satisfaction of traditional tally counting - think pen on paper, hash marks on a prison wall, or chalk marks on a scoreboard. Clean, minimal, and paper-like with subtle textures. The aesthetic is analog-inspired digital minimalism with a focus on typography, clean lines, and the ritualistic act of marking progress. Think Muji's simplicity meets a well-worn notebook.

## Color Selection

Light, paper-like aesthetic with near-black ink for marks and subtle warm tones suggesting aged paper or natural materials.

- **Primary Color**: Near-black charcoal `oklch(0.25 0.02 30)` - The color of ink on paper, used for tally marks, primary text, and key UI elements
- **Secondary Colors**: Warm off-white backgrounds `oklch(0.97 0.005 50)` for the main surface, slightly brighter white `oklch(0.99 0.002 50)` for cards, creating subtle paper-like depth
- **Accent Color**: Deep charcoal slate `oklch(0.3 0.025 35)` - For interactive elements and emphasis, suggesting pencil lead or pressed ink
- **Alert/Behind Color**: Muted red-orange `oklch(0.55 0.22 25)` - The crossing mark in a tally group, used sparingly for behind-pace warnings
- **Success/Ahead Color**: Forest green `oklch(0.45 0.18 145)` - Natural, earned progress color for ahead-of-pace status
- **Foreground/Background Pairings**:
  - Primary Charcoal `oklch(0.25 0.02 30)`: Off-white background `oklch(0.97 0.005 50)` - Ratio 11.2:1 ✓
  - Card White `oklch(0.99 0.002 50)`: Primary text `oklch(0.2 0.015 30)` - Ratio 14.8:1 ✓
  - Accent Slate `oklch(0.3 0.025 35)`: Off-white background `oklch(0.97 0.005 50)` - Ratio 9.5:1 ✓
  - Alert Red `oklch(0.55 0.22 25)`: Off-white background `oklch(0.97 0.005 50)` - Ratio 5.1:1 ✓
  - Success Green `oklch(0.45 0.18 145)`: Off-white background `oklch(0.97 0.005 50)` - Ratio 6.8:1 ✓

## Font Selection

Typography should feel modern, slightly technical (evoking data and precision) while maintaining warmth through generous spacing and bold weights for numbers.

- **Typographic Hierarchy**:
  - H1 (App Title): Geist Bold / 32px / -0.02em letter-spacing / 1.1 line-height
  - H2 (Challenge Name): Geist Semibold / 24px / -0.01em / 1.2
  - H3 (Section Headers): Geist Medium / 18px / 0em / 1.3
  - Numbers (Progress Stats): Geist Mono Bold / 48px / -0.03em / 1.0 (tabular figures for alignment)
  - Body Text: Geist Regular / 16px / 0em / 1.5
  - Small (Labels): Geist Medium / 14px / 0em / 1.4
  - Tiny (Heatmap Tooltips): Geist Regular / 12px / 0em / 1.3

## Animations

Animations should feel deliberate and pen-like, mimicking the act of drawing tally marks with subtle ink-bleed effects and organic timing.

- **Entry Logging**: Tally marks draw in with a slash animation (left to right, 0.3s each), fifth mark crosses with slight rotation, confetti uses paper-like rectangles
- **Progress Rings**: Circular progress with tally marks around the perimeter that fill in as milestones are reached, subtle scale pulse on the active segment
- **Heatmap Fills**: New entry square fades in with a gentle ink-bleed effect (0.4s ease-out), suggesting ink soaking into paper
- **Card Interactions**: Hover lifts card like picking up paper (4px, 0.2s ease), tap has subtle resistance like pressing into a surface
- **Number Updates**: Counts animate up with a flip-book effect for the changing digit, monospace font ensures alignment
- **Mark Drawing**: When adding entries, visual tally marks draw onto the screen one at a time before resolving to the final number

## Component Selection

- **Components**:
  - Dialog for challenge creation/editing (full modal with backdrop blur)
  - Sheet for quick entry logging (mobile-optimized bottom drawer)
  - Card for challenge containers (with hover states and glassmorphism)
  - Progress (Recharts PieChart for circular rings, custom SVG for thickness control)
  - Button (Primary for CTAs, Ghost for secondary actions)
  - Input for number entry and text fields
  - Textarea for notes
  - Tooltip for heatmap day details
  - Badge for streak indicators and status labels
  - Tabs for switching between dashboard/history/settings
  - Calendar custom component for heatmap grid
  - Alert Dialog for destructive actions (delete challenge)
  
- **Customizations**:
  - Custom HeatmapCalendar component (365-day grid with 5-level color scale)
  - Custom CircularProgress component (thick ring, gradient stroke, animated)
  - Custom NumberInput with giant +/- buttons and preset quick-add buttons
  - Custom ConfettiTrigger wrapper using canvas-confetti library
  
- **States**:
  - Buttons: Default (vibrant), Hover (lift + brighten), Active (press down), Disabled (50% opacity)
  - Inputs: Default (subtle border), Focus (cyan ring glow), Filled (white text on dark), Error (red border pulse)
  - Cards: Default (dark charcoal), Hover (lift + subtle glow), Pressed (scale down)
  
- **Icon Selection**:
  - Plus (add entry/challenge)
  - TrendingUp (ahead of pace)
  - TrendingDown (behind pace)
  - Target (goal target)
  - Calendar (date selection)
  - Flame (streak indicator)
  - Trophy (milestones)
  - BarChart (statistics)
  - Edit, Trash for actions
  - Check for completion
  
- **Spacing**:
  - Cards: p-6 (24px padding)
  - Card grid: gap-6 on desktop, gap-4 on mobile
  - Section spacing: space-y-8 (32px vertical rhythm)
  - Button padding: px-6 py-3 for primary, px-4 py-2 for small
  - Input padding: px-4 py-3 (touch-friendly)
  
- **Mobile**:
  - Dashboard: Single column card stack, floating + fixed bottom-right with safe area inset
  - Entry sheet: Full-width on mobile, max-w-md on desktop, number input 25% larger on touch devices
  - Heatmap: Horizontal scroll on mobile with week labels, full grid on desktop
  - Charts: Responsive aspect ratio (16:9 on mobile, 2:1 on desktop), touch-optimized tooltips
  - Navigation: Bottom tab bar on mobile (Dashboard, History, Settings), top nav on desktop
