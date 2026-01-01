# Planning Guide

A dead-simple but visually addictive yearly challenge tracker where users can create and track ambitious annual goals (10,000 push-ups, 5,000 pull-ups, 365 books) with real-time progress visualization, GitHub-style heatmaps, and celebratory micro-interactions that make logging entries irresistibly satisfying.

**Experience Qualities**:
1. **Addictive** - Every interaction should feel so satisfying that users want to log entries multiple times per day, with instant feedback, confetti celebrations, and progress that visibly fills before their eyes
2. **Motivating** - Bold visual feedback showing pace analysis (ahead/behind schedule), streaks, and remaining daily targets creates positive pressure to stay consistent
3. **Polished** - Glassmorphic cards, smooth animations, vibrant gradients, and micro-interactions create a premium feel that makes achievement tracking feel like a game

**Complexity Level**: Light Application (multiple features with basic state)
  - Core features include challenge creation, daily entry logging, progress visualization with heatmaps and charts, and pace calculation - all manageable with client-side state management using Spark's KV storage

## Essential Features

**Challenge Creation**
- Functionality: Create a new yearly challenge with name, target number, year, custom color, and icon
- Purpose: Allows users to define their ambitious annual goals with personalization
- Trigger: Click "New Challenge" button or floating + when no challenges exist
- Progression: Click new → Modal opens → Enter name (e.g. "Push-ups") → Set target (10,000) → Choose year (default current) → Pick vibrant color → Select icon from 50+ options → Save → Card appears with 0/10,000 progress
- Success criteria: Challenge persists across sessions, displays with chosen aesthetics, calculates daily pace needed

**Daily Entry Logging (Most Critical UX)**
- Functionality: Quick-add entries with challenge selection for multiple challenges, large touch targets, presets, and optional notes
- Purpose: Must be faster and more satisfying than any competing app to build daily habit
- Trigger: Tap floating + button (always visible bottom-right)
- Progression: Tap + → Bottom sheet slides up with smooth spring animation → If multiple challenges: scrollable list with color indicators and checkmarks for selection → If single challenge: shows challenge name with color indicator → Huge number input (72px font) → Tap quick presets (+1, +5, +10, +50) or type custom → Optional: expand note field → Tap "Done" → Confetti explosion + haptic feedback → Sheet dismisses → Progress ring animates to new value → Heatmap square fills → Pace recalculates with color change if status improved → Overall stats update
- Success criteria: Can log entry in under 3 seconds, animations feel buttery smooth at 60fps, confetti triggers every time, total updates without page refresh, challenge selection is clear and easy with multiple challenges, auto-selects challenge when only one exists

**Progress Dashboard**
- Functionality: Visual overview of all active challenges with overall summary stats, current totals, pace analysis, and heatmaps
- Purpose: Instant motivation boost showing progress across all challenges and what's needed to stay on track
- Trigger: App loads to dashboard by default
- Progression: User opens app → Overall stats cards appear showing total reps, today's progress, best streak, and challenges ahead of pace → Grid of challenge cards loads → Each card shows: Colored top border for quick identification → Bold total/target → Thick circular progress ring (animated) → Mini heatmap showing year activity → "Remaining" section with days left, required daily pace (color-coded: green=ahead, gold=on pace, red=behind), and encouraging message → Can scroll through multiple challenges easily
- Success criteria: All data loads instantly from KV storage, colors accurately reflect pace status, heatmap renders 365 days without lag, overall stats aggregate across all challenges correctly, grid layout responsive (1 column mobile, 2 tablet, 3 desktop)

**Challenge Detail View**
- Functionality: Full-screen deep dive into a single challenge with charts, stats, and history
- Purpose: Satisfies user curiosity about patterns and achievements while celebrating milestones
- Trigger: Click anywhere on a challenge card
- Progression: Tap card → Smooth page transition → Large heatmap appears → Scroll to see cumulative line chart (actual vs perfect pace) → Weekly average bar chart → Stats grid (best day, current streak, longest streak, total days active) → List of recent entries with edit/delete options
- Success criteria: Charts render smoothly using Recharts, streak calculations accurate, can navigate back to dashboard

**Pace Intelligence**
- Functionality: Real-time calculation of daily requirement, ahead/behind status, and motivational messaging
- Purpose: Creates positive pressure to maintain consistency and celebrates being ahead
- Trigger: Automatically recalculates after every entry and on dashboard load
- Progression: System calculates: Total remaining → Days left in year → Required daily pace → Compares actual pace to required → Generates message: "You're 142 reps ahead 🔥" or "Need 8 extra per day this week to catch up"
- Success criteria: Math is always accurate (accounts for year, leap years), messages feel encouraging not discouraging, color coding is instantly recognizable

**Heatmap Calendar**
- Functionality: GitHub-style contribution graph showing intensity by day
- Purpose: Visual streak reinforcement and pattern recognition (user sees gaps immediately)
- Trigger: Displays on every challenge card and detail view
- Progression: Renders 365 day grid → Each square colored by intensity (5 levels from light to dark vibrant green) → Hover/tap shows tooltip: "Wed 18 Jun – 87 reps" + note if exists → Click day opens quick view modal with day's entries
- Success criteria: All 365 days render in under 100ms, color scale matches GitHub aesthetic, tooltips don't lag on mobile

## Edge Case Handling

**Empty States** - First-time users see hero section with "Create your first challenge" CTA instead of empty grid
**No Entries Yet** - Challenge cards show 0/target with heatmap of empty squares and message "Start today!"
**Year Rollover** - Challenges auto-archive when year ends, new year shows option to "Continue this challenge in 2026"
**Offline State** - Entries queue in localStorage, sync when connection returns (with toast notification)
**Invalid Inputs** - Negative numbers rejected, zero target shows error, dates in future disabled
**Deleted Challenges** - Soft delete with 30-day recovery window, then permanent purge
**Multiple Entries Same Day** - Aggregates into single heatmap square, detail view shows all individual entries

## Design Direction

The design should feel like a premium fitness tracking app meets a gamified achievement system – energizing, modern, and slightly futuristic with vibrant neon accents against deep dark backgrounds. Every interaction should spark joy through smooth animations, bold typography, and celebration of progress. Think Stripe's polish meets Duolingo's gamification meets GitHub's data visualization.

## Color Selection

Dark mode aesthetic with vibrant, high-contrast accent colors that pop against near-black backgrounds.

- **Primary Color**: Electric cyan `oklch(0.75 0.15 195)` - Represents progress, energy, and forward momentum; used for primary buttons and key CTAs
- **Secondary Colors**: Deep charcoal backgrounds `oklch(0.15 0 0)` for cards, slightly lighter `oklch(0.2 0 0)` for elevated elements, creating subtle depth hierarchy
- **Accent Color**: Vibrant emerald green `oklch(0.7 0.2 145)` - Celebration color for "ahead of pace" status, milestone achievements, and success states
- **Foreground/Background Pairings**:
  - Primary Cyan `oklch(0.75 0.15 195)`: Near-black text `oklch(0.1 0 0)` - Ratio 8.2:1 ✓
  - Background Dark `oklch(0.12 0 0)`: Off-white text `oklch(0.95 0 0)` - Ratio 15.3:1 ✓
  - Accent Green `oklch(0.7 0.2 145)`: Near-black text `oklch(0.1 0 0)` - Ratio 7.1:1 ✓
  - Warning Red (behind pace) `oklch(0.65 0.25 25)`: Near-black text `oklch(0.1 0 0)` - Ratio 5.2:1 ✓
  - Card Charcoal `oklch(0.2 0 0)`: Off-white text `oklch(0.95 0 0)` - Ratio 12.1:1 ✓

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

Animations should be purposeful and fast, creating satisfaction without delays – prioritize micro-interactions that give tactile feedback.

- **Entry Logging**: Number counter animates up with spring physics (0.4s), confetti bursts from center for 1.2s, haptic pulse (if mobile)
- **Progress Rings**: Circular progress animates with ease-out curve over 0.8s when value changes, subtle pulse on milestone (every 10%)
- **Heatmap Fills**: New entry square fades in color with 0.3s ease-out, scales from 0.8 to 1.0 for emphasis
- **Card Interactions**: Hover lifts card 4px with 0.2s ease, tap scales to 0.98 for 0.1s (tactile press)
- **Sheet Transitions**: Bottom sheet slides up with spring (stiffness 300, damping 30), backdrop fades in simultaneously
- **Pace Status Changes**: When crossing from behind to ahead, green glow pulse for 0.5s with scale 1.05

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
