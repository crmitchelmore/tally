# Issues Found During E2E Testing

## UI/UX Issues

### 1. Create Challenge Dialog - Submit Button Cut Off
- **Location**: `src/components/challenges/create-challenge-dialog.tsx`
- **Problem**: Dialog content exceeds viewport height, submit button is partially visible but not clickable
- **Fix**: Add max-height with overflow-y scroll to dialog content, or reduce vertical spacing

