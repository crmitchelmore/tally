#!/bin/bash
# Run E2E tests against dev Clerk and dev Convex
# Requires CLERK_SECRET_KEY_DEV and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV in .env

set -e

cd "$(dirname "$0")/.."

# Source .env to get dev credentials
if [ -f .env ]; then
  export $(grep -E '^(CLERK_SECRET_KEY_DEV|NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV|CONVEX_DEPLOYMENT_DEV|TEST_USER_EMAIL|TEST_USER_PASSWORD)=' .env | xargs)
fi

# Check required vars
if [ -z "$CLERK_SECRET_KEY_DEV" ] || [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV" ]; then
  echo "Error: CLERK_SECRET_KEY_DEV and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV must be set in .env"
  echo "Get these from Clerk Dashboard > API Keys (dev instance)"
  exit 1
fi

echo "🔧 Building with dev Clerk credentials..."
CONVEX_DEPLOYMENT="$CONVEX_DEPLOYMENT_DEV" \
CLERK_SECRET_KEY="$CLERK_SECRET_KEY_DEV" \
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV" \
bun run build

echo "🧪 Running E2E tests against dev..."
CONVEX_DEPLOYMENT="$CONVEX_DEPLOYMENT_DEV" \
CLERK_SECRET_KEY="$CLERK_SECRET_KEY_DEV" \
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV" \
TEST_USER_EMAIL="${TEST_USER_EMAIL:-test@tally-tracker.app}" \
TEST_USER_PASSWORD="${TEST_USER_PASSWORD:-Sword%ip4}" \
bun run test:e2e --grep @authenticated
