# Tally Migration Master Plan

## ⚠️ Git Commit Guidelines

> **COMMIT SENSIBLY AS YOU GO**: Make frequent, atomic commits with detailed messages for history tracking. Each commit should represent a logical unit of work that can be understood months later.

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `docs`: Documentation only changes
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, or tooling changes
- `style`: Formatting, missing semicolons, etc.

### Examples
```bash
# Good commit messages
git commit -m "feat(convex): add challenges schema with indexes

- Define challenges table with userId, name, targetNumber fields
- Add indexes for by_user, by_public, by_user_archived
- Include timeframeUnit union type for year/month/custom"

git commit -m "feat(auth): implement Clerk authentication flow

- Add ClerkProvider to app layout
- Create sign-in and sign-up pages
- Configure middleware for protected routes
- Add user sync hook to create Convex user on login"

git commit -m "fix(ios): resolve heatmap calendar rendering on small screens

- Adjust grid spacing for iPhone SE
- Fix date calculation for month boundaries
- Add horizontal scroll for year view"

git commit -m "test(web): add unit tests for stats calculations

- Test calculateProgress with edge cases
- Test streak calculation across month boundaries
- Test pace status determination
- Coverage now at 78%"
```

### When to Commit
- ✅ After completing each subtask in the TODO list
- ✅ After each verification step passes
- ✅ Before and after any risky changes
- ✅ When switching between different areas of work
- ✅ At natural stopping points (end of day, before breaks)

### When NOT to Commit
- ❌ In the middle of a broken state
- ❌ With unrelated changes bundled together
- ❌ With vague messages like "WIP" or "fixes"

### Branch Strategy
```bash
# Create feature branches from main
git checkout -b feat/project-1-nextjs-setup
git checkout -b feat/project-1-convex-schema
git checkout -b feat/project-1-clerk-auth

# Merge back to main after task completion
git checkout main
git merge feat/project-1-nextjs-setup
```

---

## Overview

This migration transforms Tally from a Vite + React + GitHub Spark application into a multi-platform ecosystem:

- **Web**: Next.js on Vercel with Convex database
- **iOS**: Native Swift/SwiftUI app
- **Android**: Native Kotlin/Jetpack Compose app

## ⚠️ Critical Instructions

> **CONTINUE UNTIL COMPLETE**: Every task must be executed to 100% completion. Do not check off any item until it has been **validated as working via a test**. If issues arise, debug and fix them immediately.

> **TODO List Rules**:
> 1. Never check off an item until it's been tested and verified working
> 2. Larger items have sub-item TODO lists - complete ALL sub-items first
> 3. Only remove a parent item when ALL children are complete and verified
> 4. Run agent reviews before marking projects complete

---

## Project Structure

| Document | Description | Duration |
|----------|-------------|----------|
| [PROJECT-1-NEXTJS.md](./PROJECT-1-NEXTJS.md) | Next.js + Vercel + Convex + Clerk | 2-3 weeks |
| [PROJECT-2-API.md](./PROJECT-2-API.md) | Shared HTTP API Layer | 3-4 days |
| [PROJECT-3-IOS.md](./PROJECT-3-IOS.md) | Native iOS App | 3-4 weeks |
| [PROJECT-4-ANDROID.md](./PROJECT-4-ANDROID.md) | Native Android App | 3-4 weeks |
| [PROJECT-5-LAUNCH.md](./PROJECT-5-LAUNCH.md) | Cross-Platform Polish & Launch | 1-2 weeks |

**Total Duration: 10-14 weeks**

---

## Master TODO List

### Phase 1: Foundation
- [ ] **PROJECT 1: Next.js Web Migration** (see [PROJECT-1-NEXTJS.md](./PROJECT-1-NEXTJS.md))
  - [ ] Task 1.1: Project Initialization
  - [ ] Task 1.2: shadcn/ui Component Setup
  - [ ] Task 1.3: Convex Database Setup
  - [ ] Task 1.4: Authentication with Clerk
  - [ ] Task 1.5: Component Migration
  - [ ] Task 1.6: Real-time Features
  - [ ] Task 1.7: Deployment to Vercel
  - [ ] Project 1 Completion Checklist verified

### Phase 2: API Layer
- [ ] **PROJECT 2: Shared API Layer** (see [PROJECT-2-API.md](./PROJECT-2-API.md))
  - [ ] Task 2.1: Convex HTTP Actions
  - [ ] Task 2.2: API Documentation
  - [ ] Task 2.3: Shared Types Package
  - [ ] Project 2 Completion Checklist verified

### Phase 3: Mobile Apps (can run in parallel)
- [ ] **PROJECT 3: Native iOS App** (see [PROJECT-3-IOS.md](./PROJECT-3-IOS.md))
  - [ ] Task 3.1: Xcode Project Setup
  - [ ] Task 3.2: Data Models & API Service
  - [ ] Task 3.3: Authentication
  - [ ] Task 3.4: Core UI Components
  - [ ] Task 3.5: Main Views
  - [ ] Task 3.6: Native Features
  - [ ] Task 3.7: Testing & App Store
  - [ ] Project 3 Completion Checklist verified

- [ ] **PROJECT 4: Native Android App** (see [PROJECT-4-ANDROID.md](./PROJECT-4-ANDROID.md))
  - [ ] Task 4.1: Android Studio Setup
  - [ ] Task 4.2: Data Layer
  - [ ] Task 4.3: Authentication
  - [ ] Task 4.4: UI Components
  - [ ] Task 4.5: Main Screens
  - [ ] Task 4.6: Native Features
  - [ ] Task 4.7: Testing & Play Store
  - [ ] Project 4 Completion Checklist verified

### Phase 4: Launch
- [ ] **PROJECT 5: Cross-Platform Launch** (see [PROJECT-5-LAUNCH.md](./PROJECT-5-LAUNCH.md))
  - [ ] Task 5.1: Feature Parity Verification
  - [ ] Task 5.2: Bug Fixes
  - [ ] Task 5.3: Performance Optimization
  - [ ] Task 5.4: Launch Preparation
  - [ ] Project 5 Completion Checklist verified

---

## Agent Review Checklist

Before marking the migration complete, run each specialist agent to review and add their recommendations. **Do not check these off until the agent has been run and all their findings addressed.**

### Research & Strategy Agents
- [ ] **broad-researcher**: Survey problem space, identify patterns, map options/risks
  - [ ] Run agent with: "Review the Tally migration plan and identify patterns, risks, and alternative approaches"
  - [ ] Document findings
  - [ ] Address all identified risks
  - [ ] Implement recommended alternatives where appropriate

- [ ] **deep-researcher**: Rigorous technical investigation
  - [ ] Run agent with: "Deep dive into Convex + Clerk + Next.js integration best practices"
  - [ ] Document findings
  - [ ] Apply recommended best practices
  - [ ] Verify assumptions are correct

- [ ] **think-tank-idea-generator**: Strategic ideas and experiments
  - [ ] Run agent with: "Generate strategic product and technical ideas for Tally multi-platform launch"
  - [ ] Document ideas
  - [ ] Prioritize ideas by value/effort
  - [ ] Implement top 3 quick wins

### Technical Specialist Agents
- [ ] **software-architect**: Design boundaries and interfaces
  - [ ] Run agent with: "Review Tally architecture across web/iOS/Android for consistency and evolution paths"
  - [ ] Document architecture recommendations
  - [ ] Update diagrams if needed
  - [ ] Address any coupling issues

- [ ] **senior-software-engineer**: Code quality and maintainability
  - [ ] Run agent with: "Review Tally codebase for correctness, maintainability, and design improvements"
  - [ ] Document code review findings
  - [ ] Fix identified issues
  - [ ] Refactor where recommended

- [ ] **security-engineer**: Security audit
  - [ ] Run agent with: "Security audit of Tally: auth flows, data handling, API security across all platforms"
  - [ ] Document security findings
  - [ ] Fix all HIGH/CRITICAL issues
  - [ ] Implement security recommendations
  - [ ] Re-verify after fixes

- [ ] **performance-engineer**: Performance optimization
  - [ ] Run agent with: "Performance audit of Tally web, iOS, and Android apps"
  - [ ] Document performance metrics
  - [ ] Optimize any metrics below target
  - [ ] Re-measure after optimizations

- [ ] **testing-engineer**: Test strategy and coverage
  - [ ] Run agent with: "Review Tally test strategy and add high-value automated tests"
  - [ ] Document test coverage gaps
  - [ ] Add recommended tests
  - [ ] Verify coverage meets targets (>70%)

- [ ] **tech-standards**: Engineering standards compliance
  - [ ] Run agent with: "Check Tally against engineering standards for style, architecture, security baselines"
  - [ ] Document standards gaps
  - [ ] Fix all violations
  - [ ] Verify compliance

### Design & Documentation Agents
- [ ] **product-designer**: UX and design quality
  - [ ] Run agent with: "Review Tally UX across web/iOS/Android for consistency and interaction patterns"
  - [ ] Document UX findings
  - [ ] Fix inconsistencies
  - [ ] Verify design system alignment

- [ ] **ux-expert**: Usability evaluation
  - [ ] Run agent with: "Evaluate Tally usability, information architecture, and propose improvements"
  - [ ] Document usability issues
  - [ ] Implement high-leverage improvements
  - [ ] Verify improvements work

- [ ] **technical-documenter**: Documentation quality
  - [ ] Run agent with: "Review and improve Tally documentation: README, API docs, onboarding guides"
  - [ ] Document gaps
  - [ ] Update/create documentation
  - [ ] Verify docs are accurate and helpful

---

## Final Launch Verification

Only check these off after ALL projects and agent reviews are complete:

- [ ] Web app live at production URL
- [ ] iOS app approved and live on App Store
- [ ] Android app approved and live on Play Store
- [ ] All platforms share same database (Convex)
- [ ] Authentication works cross-platform
- [ ] Real-time sync verified (< 2 second delay)
- [ ] Error monitoring active on all platforms
- [ ] Analytics tracking on all platforms
- [ ] Support channel ready
- [ ] All agent reviews complete and findings addressed

---

## How to Use This Plan

1. **Start with Project 1** - Complete ALL tasks before moving on
2. **For each task**:
   - Read the detailed steps in the project document
   - Execute each step
   - Run verification commands
   - Check "Definition of Done" criteria
   - Only then check off the task
3. **After each project** - Run the completion checklist
4. **Before final launch** - Run ALL agent reviews
5. **After agent reviews** - Address all findings, then verify launch checklist

---

## Dependencies

```
Project 1 (Next.js)
    ↓
Project 2 (API)
    ↓
┌───┴───┐
↓       ↓
Project 3   Project 4
(iOS)       (Android)
└───┬───┘
    ↓
Project 5 (Launch)
```

Projects 3 and 4 can run in parallel after Project 2 is complete.

---

## Quick Reference

### Key Commands
```bash
# Next.js development
npm run dev
npm run build
npx tsc --noEmit

# Convex
npx convex dev
npx convex deploy --prod

# iOS (in Xcode)
Cmd+B  # Build
Cmd+R  # Run
Cmd+U  # Test

# Android
./gradlew assembleDebug
./gradlew test
```

### Environment Variables Needed
```env
# Web (.env.local)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CONVEX_URL=

# iOS (Info.plist or Config)
CLERK_PUBLISHABLE_KEY=
CONVEX_URL=

# Android (local.properties or BuildConfig)
CLERK_PUBLISHABLE_KEY=
CONVEX_URL=
```
