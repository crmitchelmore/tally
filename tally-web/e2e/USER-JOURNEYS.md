# User Journeys - Tally Web App

This document defines the core user journeys that E2E tests must cover.

## Journey 1: New User Onboarding
**Goal:** New user creates an account and starts tracking their first challenge.

### Steps:
1. Land on homepage (/)
2. Click "Create an account" → Navigate to /sign-up
3. Complete sign-up form (email + password)
4. Redirect to /app (authenticated)
5. See empty dashboard with "Create your first challenge" prompt
6. Click "New Challenge" → Dialog opens
7. Fill in challenge details (name, target, timeframe)
8. Submit → Challenge created
9. See challenge card on dashboard

### Critical Assertions:
- Sign-up form renders and accepts input
- Authenticated redirect to /app works
- Empty state shows new user guidance
- Challenge creation modal works end-to-end

---

## Journey 2: Returning User Sign In
**Goal:** Existing user signs in and views their dashboard.

### Steps:
1. Navigate to /sign-in
2. Enter email + password
3. Submit → Redirect to /app
4. See dashboard with existing challenges
5. View challenge progress (total, pace, streak)

### Critical Assertions:
- Sign-in form renders and accepts input
- Authentication persists via cookie
- Dashboard loads user's challenges
- Stats display correctly

---

## Journey 3: Log an Entry (Core Action)
**Goal:** User logs progress toward a challenge.

### Steps:
1. User is authenticated on /app
2. Click a challenge card → Detail view opens
3. Click "Add Entry" button
4. Enter count (e.g., 50)
5. Optionally add note/feeling
6. Submit → Entry saved
7. See updated total and confetti animation
8. Verify heatmap shows new activity

### Critical Assertions:
- Entry dialog opens and accepts input
- Validation prevents invalid entries (negative, future dates)
- Submit saves data and updates UI optimistically
- Confetti plays (unless reduced motion)

---

## Journey 4: Edit/Delete Entry
**Goal:** User corrects a mistake in their logged data.

### Steps:
1. View challenge detail
2. Click on a day in heatmap with existing entry
3. Day entries dialog opens
4. Click edit on an entry → Edit dialog
5. Change count, save
6. Verify total updates
7. Delete an entry → Confirm
8. Verify total decreases

### Critical Assertions:
- Heatmap days are clickable
- Edit persists changes correctly
- Delete removes entry and updates stats

---

## Journey 5: Create Custom Timeframe Challenge
**Goal:** User creates a challenge with custom start/end dates.

### Steps:
1. Click "New Challenge" on dashboard
2. Enter name, target
3. Select "Custom" timeframe
4. Pick start date and duration (e.g., 30 days)
5. Verify end date calculates correctly
6. Submit
7. See challenge with correct date range displayed

### Critical Assertions:
- Custom date picker works
- End date auto-calculates from start + duration
- Challenge displays correct timeframe label

---

## Journey 6: Archive Challenge
**Goal:** User archives a completed/abandoned challenge.

### Steps:
1. Open challenge detail
2. Click Settings → Challenge settings dialog
3. Toggle "Archive this challenge"
4. Confirm → Challenge hidden from active list
5. Verify challenge no longer shows on main dashboard

### Critical Assertions:
- Archive toggle saves correctly
- Dashboard filters out archived challenges

---

## Journey 7: Export Data
**Goal:** User downloads their data for backup.

### Steps:
1. Navigate to settings/data section
2. Click "Export" → Format selection
3. Choose JSON or CSV
4. Download completes
5. Verify file contains challenges and entries

### Critical Assertions:
- Export button accessible
- File downloads with correct format
- Data integrity (all challenges/entries present)

---

## Journey 8: Community - Browse Public Challenges
**Goal:** User discovers and follows public challenges.

### Steps:
1. Navigate to /community
2. See list of public challenges
3. Use search to filter
4. Click "Follow" on a challenge
5. See follow confirmation
6. Navigate to dashboard → See followed challenge in "Following" section

### Critical Assertions:
- Public challenges load
- Search filters correctly
- Follow action persists
- Followed challenges appear on dashboard

---

## Journey 9: View Weekly Summary
**Goal:** User reviews their weekly performance.

### Steps:
1. On dashboard or challenge detail
2. Click "Weekly Summary" button
3. Modal shows week stats (total, average, best day)
4. Navigate to previous week
5. Close modal

### Critical Assertions:
- Summary modal opens
- Stats calculate correctly
- Week navigation works
- Modal dismisses properly

---

## Journey 10: Sign Out
**Goal:** User signs out of their account.

### Steps:
1. Click user menu/avatar
2. Click "Sign out"
3. Redirect to homepage (/)
4. Try accessing /app → Redirect to sign-in

### Critical Assertions:
- Sign out clears session
- Protected routes redirect to auth
