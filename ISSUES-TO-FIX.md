# Issues Found During E2E Testing

## UI/UX Issues

### 1. Create Challenge Dialog - Submit Button Cut Off
- **Location**: `src/components/challenges/create-challenge-dialog.tsx`
- **Problem**: Dialog content exceeds viewport height, submit button is partially visible but not clickable
- **Fix**: Add max-height with overflow-y scroll to dialog content, or reduce vertical spacing


### 2. Create Challenge Button Below Fold on Dashboard
- **Location**: `src/components/challenges/challenge-list.tsx`
- **Problem**: On standard viewport (800px height), the "Create Challenge" button is at y:757, below the visible area
- **Fix**: Add a floating action button (FAB) or put create action in header/nav when no challenges exist

