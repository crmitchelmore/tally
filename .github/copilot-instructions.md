# Tally - Copilot Instructions

## Quick Reference

- **Custom Agent**: Use `tally` agent for project-specific assistance
- **Context File**: Read `CONTEXT.md` for full project state
- **Mental Model**: Read `docs/MENTAL-MODEL.md`
- **Design Philosophy**: Read `docs/DESIGN-PHILOSOPHY.md`
- **Domain**: https://tally-tracker.app

## Project Overview

Tally is a multi-platform challenge tracking app:
- **Web**: Next.js 16 + Convex + Clerk (in `tally-web/`)
- **iOS**: Coming soon (in `tally-ios/`)
- **Android**: Coming soon (in `tally-android/`)
- **Infrastructure**: Pulumi TypeScript (in `infra/`)

## Critical Rules

### Package Manager
- **Web app (`tally-web/`)**: Use `bun` (NOT npm/yarn)
- **Infrastructure (`infra/`)**: Use `npm`

### Infrastructure
- **NEVER** change infrastructure manually in dashboards
- **ALWAYS** use Pulumi: `cd infra && pulumi up`
- Commit all infra changes to git

### Authentication (Clerk)
- Use `clerkMiddleware()` in `proxy.ts`
- Do NOT use deprecated `authMiddleware()`
- App Router only (no pages router patterns)
- Never hardcode keys - use `.env`

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS, shadcn/ui |
| Backend | Convex (real-time database) |
| Auth | Clerk |
| DNS | Cloudflare |
| Hosting | Vercel |
| IaC | Pulumi (TypeScript) |
| Package Manager | Bun (web), npm (infra) |

## Infrastructure Changes (IMPORTANT)

**All infrastructure changes MUST be made via Pulumi**, not manually in dashboards.

### Pulumi Setup

```bash
cd infra

# Set environment variables
export PULUMI_ACCESS_TOKEN=<from .env>
export PATH="$HOME/.pulumi/bin:$PATH"

# Preview changes
pulumi preview

# Apply changes
pulumi up

# View current state
pulumi stack
```

### Managed Resources

The following are managed by Pulumi in `infra/index.ts`:

- **Cloudflare DNS** (tally-tracker.app zone)
  - A record: @ → Vercel IP
  - CNAME: www → cname.vercel-dns.com
  - TXT: _vercel → domain verification

- **Vercel Domains**
  - tally-tracker.app (primary)
  - www.tally-tracker.app (redirects to root)

- **Clerk Configuration**
  - Redirect URLs for OAuth flows

### Adding New Infrastructure

1. Edit `infra/index.ts`
2. Run `pulumi preview` to see changes
3. Run `pulumi up` to apply
4. Commit changes to git

### Importing Existing Resources

```bash
# Import command format:
pulumi import <type> <name> <id>

# Examples:
pulumi import cloudflare:index/dnsRecord:DnsRecord my-record zone_id/record_id
pulumi import vercel:index/projectDomain:ProjectDomain my-domain team_id/project_id/domain
```

## Environment Variables

All secrets are in the root `.env` file (gitignored):

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Convex
CONVEX_DEPLOYMENT=dev:...

# Infrastructure
CLOUDFLARE_API_TOKEN=...
VERCEL_API_TOKEN=...
PULUMI_ACCESS_TOKEN=...
```

## Development

```bash
# Web app
cd tally-web
bun install
bun run dev

# Infrastructure
cd infra
npm install
pulumi up
```

## Deployment

- **Web**: Auto-deploys via Vercel on push to main
- **Infra**: Manual via `pulumi up` (or CI/CD)

## Migration Plan

See `docs/migration/README.md` for the full migration roadmap.

Current status:
- ✅ Project 1: Next.js Web Migration
- ⏳ Project 2: Shared API Layer
- ⏳ Project 3: iOS App
- ⏳ Project 4: Android App
- ⏳ Project 5: Launch
