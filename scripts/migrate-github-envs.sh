#!/bin/bash
# GitHub Environment Migration Script
# Migrates from _DEV/_PROD suffixed repo secrets to proper GitHub environments
#
# This script:
# 1. Creates/verifies GitHub environments (development, production)
# 2. Copies environment-specific secrets from repo level to environments
# 3. Keeps shared secrets at repo level
# 4. Optionally deletes old suffixed secrets after migration
#
# Prerequisites:
# - gh CLI authenticated with appropriate permissions
# - Access to the repository secrets
#
# Usage: ./scripts/migrate-github-envs.sh [--delete-old]

set -e

REPO="crmitchelmore/tally"
DELETE_OLD=false

if [[ "$1" == "--delete-old" ]]; then
  DELETE_OLD=true
fi

echo "🔄 GitHub Environment Migration for $REPO"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
info() { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✗${NC} $1"; }

# Check gh is authenticated
if ! gh auth status &>/dev/null; then
  error "gh CLI not authenticated. Run 'gh auth login' first."
  exit 1
fi

# =============================================================================
# Step 1: Create/Verify GitHub Environments
# =============================================================================
echo "📦 Step 1: Creating GitHub Environments"
echo "----------------------------------------"

for env in development production; do
  if gh api "repos/$REPO/environments/$env" &>/dev/null; then
    info "Environment '$env' already exists"
  else
    gh api "repos/$REPO/environments/$env" -X PUT &>/dev/null
    info "Created environment '$env'"
  fi
done

echo ""

# =============================================================================
# Step 2: Define Secret Mappings
# =============================================================================
# Format: "OLD_NAME:NEW_NAME:ENVIRONMENT"
# - development = dev environment secrets
# - production = prod environment secrets
# - repo = stays at repo level (shared)

declare -a SECRET_MAPPINGS=(
  # Development environment secrets (from _DEV suffix)
  "CLERK_SECRET_KEY_DEV:CLERK_SECRET_KEY:development"
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV:NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:development"
  "CONVEX_DEPLOY_KEY_DEV:CONVEX_DEPLOY_KEY:development"
  
  # Production environment secrets (from _PROD suffix)
  "CLERK_SECRET_KEY_PROD:CLERK_SECRET_KEY:production"
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD:NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:production"
  "CONVEX_DEPLOY_KEY_PROD:CONVEX_DEPLOY_KEY:production"
  
  # Shared secrets (stay at repo level - no migration needed)
  # PULUMI_ACCESS_TOKEN - repo
  # VERCEL_TOKEN - repo
  # VERCEL_ORG_ID - repo
  # VERCEL_PROJECT_ID - repo
  # SENTRY_AUTH_TOKEN - repo
  # TEST_USER_EMAIL - repo
  # TEST_USER_PASSWORD - repo
  # CLOUDFLARE_API_TOKEN - repo
  # GRAFANA_CLOUD_ADMIN_TOKEN - repo
  # GRAFANA_CLOUD_OTLP_TOKEN - repo
)

# =============================================================================
# Step 3: Migrate Secrets to Environments
# =============================================================================
echo "🔐 Step 2: Migrating Secrets to Environments"
echo "---------------------------------------------"
echo ""
echo "NOTE: This script cannot read existing secret values."
echo "You need to provide the secret values manually or use the interactive mode."
echo ""

# Function to set environment secret
set_env_secret() {
  local old_name="$1"
  local new_name="$2"
  local env="$3"
  
  echo ""
  echo "Migrating: $old_name → $new_name (environment: $env)"
  
  # Check if secret exists at repo level
  if ! gh secret list -R "$REPO" | grep -q "^$old_name"; then
    warn "Source secret '$old_name' not found at repo level. Skipping."
    return
  fi
  
  # Check if already exists in environment
  if gh secret list -R "$REPO" --env "$env" 2>/dev/null | grep -q "^$new_name"; then
    info "Secret '$new_name' already exists in '$env' environment"
    return
  fi
  
  # Prompt for secret value (since we can't read existing secrets)
  echo "Enter value for $new_name (will be hidden):"
  read -s secret_value
  
  if [ -z "$secret_value" ]; then
    warn "Empty value provided. Skipping $new_name"
    return
  fi
  
  # Set secret in environment
  echo "$secret_value" | gh secret set "$new_name" -R "$REPO" --env "$env" --body -
  info "Set secret '$new_name' in '$env' environment"
}

# =============================================================================
# Step 4: Interactive Migration
# =============================================================================
echo ""
echo "🔄 Step 3: Interactive Secret Migration"
echo "----------------------------------------"
echo ""
echo "For each secret, you'll need to provide the value."
echo "Press Ctrl+C to cancel at any time."
echo ""

read -p "Do you want to proceed with interactive migration? (y/N): " proceed
if [[ "$proceed" != "y" && "$proceed" != "Y" ]]; then
  echo ""
  echo "Migration cancelled. You can set secrets manually with:"
  echo ""
  echo "  # Development secrets:"
  echo "  gh secret set CLERK_SECRET_KEY --env development --body \"\$VALUE\""
  echo "  gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --env development --body \"\$VALUE\""
  echo "  gh secret set CONVEX_DEPLOY_KEY --env development --body \"\$VALUE\""
  echo ""
  echo "  # Production secrets:"
  echo "  gh secret set CLERK_SECRET_KEY --env production --body \"\$VALUE\""
  echo "  gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY --env production --body \"\$VALUE\""
  echo "  gh secret set CONVEX_DEPLOY_KEY --env production --body \"\$VALUE\""
  echo ""
  exit 0
fi

for mapping in "${SECRET_MAPPINGS[@]}"; do
  IFS=':' read -r old_name new_name env <<< "$mapping"
  set_env_secret "$old_name" "$new_name" "$env"
done

echo ""

# =============================================================================
# Step 5: Optionally Delete Old Secrets
# =============================================================================
if $DELETE_OLD; then
  echo "🗑️  Step 4: Cleaning Up Old Secrets"
  echo "------------------------------------"
  
  declare -a OLD_SECRETS=(
    "CLERK_SECRET_KEY_DEV"
    "CLERK_SECRET_KEY_PROD"
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_DEV"
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_PROD"
    "CONVEX_DEPLOY_KEY_DEV"
    "CONVEX_DEPLOY_KEY_PROD"
    # Also clean up old non-suffixed duplicates if using environments
    "CLERK_SECRET_KEY"
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
    "CONVEX_DEPLOYMENT"
  )
  
  for secret in "${OLD_SECRETS[@]}"; do
    if gh secret list -R "$REPO" | grep -q "^$secret"; then
      read -p "Delete repo-level secret '$secret'? (y/N): " delete
      if [[ "$delete" == "y" || "$delete" == "Y" ]]; then
        gh secret delete "$secret" -R "$REPO"
        info "Deleted '$secret' from repo secrets"
      else
        warn "Kept '$secret' at repo level"
      fi
    fi
  done
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "✅ Migration Summary"
echo "===================="
echo ""
echo "Environment secrets configured:"
echo ""
echo "📁 development:"
gh secret list -R "$REPO" --env development 2>/dev/null || echo "  (none or no access)"
echo ""
echo "📁 production:"
gh secret list -R "$REPO" --env production 2>/dev/null || echo "  (none or no access)"
echo ""
echo "📁 Repository (shared):"
gh secret list -R "$REPO" | head -20
echo ""
echo "Next steps:"
echo "1. Update workflows to use 'environment:' directive"
echo "2. Test deployments to both environments"
echo "3. Remove old suffixed secrets when confident"
