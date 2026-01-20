# Feature: Landing page + web app — CD (deploy early)

## Goal
Be able to deploy a "hello world" version of the landing page and the web app to **production** immediately, so copy/CTA can be reviewed on a real URL and iterated quickly.

## Scope
- Create/confirm Vercel project(s) for the landing page and web app.
- Configure production domain + HTTPS.
- Configure required environment variables (minimize secrets; use Vercel env vars, not committed files).
- Ensure **merge to default branch** triggers a production deploy (CD) via GitHub Actions.
- Add a minimal `/` route (or equivalent) that renders a "hello world" landing page shell.
- Add/confirm a minimal `/app` route (or equivalent) that renders a "hello world" web app shell.

### CD Workflow (GitHub Actions)
**Trigger:** Push to the default branch (e.g. `main`)  
**Job:** `deploy-production`

**Steps:**
1. Checkout repository
2. Setup Bun runtime
3. Install dependencies (`bun install`)
4. Build (`bun run build`) — verify the app can be deployed
5. Deploy to Vercel production (`vercel deploy --prod`)
6. Smoke check the production domain/URL (HTTP 200) to verify the deploy is live

**Secrets (GitHub Actions):**
- `VERCEL_API_TOKEN` — Vercel API token for deployment
- `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` — used to write `.vercel/project.json` during CI/CD (we don't commit `.vercel/`).
- `VERCEL_PROD_URL` — production URL for smoke checks (set to `https://tally-tracker.app/`).

**Implementation approach:**
- Use Vercel CLI (`vercel deploy --prod`) for explicit control and visibility
- Alternatively: official `amondnet/vercel-action@v25` or `vercel/actions`
- Build step validates deployability before pushing to Vercel
- Deployment status visible in commit status checks

**Minimal workflow template (copy/paste):**
```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: tally-web
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2

      - name: Ensure Vercel project link
        env:
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: |
          if [ ! -f ".vercel/project.json" ]; then
            mkdir -p .vercel
            printf '{"orgId":"%s","projectId":"%s"}\n' "$VERCEL_ORG_ID" "$VERCEL_PROJECT_ID" > .vercel/project.json
          fi

      - run: bun install
      - name: bun run build
        env:
          NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY }}
          CLERK_SECRET_KEY: ${{ secrets.CLERK_SECRET_KEY }}
        run: bun run build

      - name: Deploy (Vercel)
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_API_TOKEN }}
        run: npx vercel deploy --prod --yes --token=$VERCEL_TOKEN

      - name: Smoke check
        env:
          VERCEL_PROD_URL: ${{ secrets.VERCEL_PROD_URL }}
        run: curl -fsS "$VERCEL_PROD_URL" >/dev/null
```

**Optional (not required):**
- PR preview workflow: deploys preview on pull requests using `vercel deploy` (without `--prod`)
- Allows content review on ephemeral URLs before merge

## Key references (canonical docs)
- Vercel deployments: https://vercel.com/docs/deployments/overview
- Vercel env vars: https://vercel.com/docs/projects/environment-variables
- Cloudflare API tokens: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- Cloudflare DNS records API: https://developers.cloudflare.com/api/resources/dns/subresources/records/

## Non-goals (this is for later)
- Full CI suite (lint/test/perf/a11y gating)
- Branch protection / PR gating (we’re explicitly not requiring PRs right now)

## Acceptance criteria
- A production URL exists and serves the landing page.
- A trivial copy change merged to the default branch results in an updated production deploy.
- Deployment status is visible (Vercel dashboard and/or commit status).
- GitHub Actions workflow runs successfully on push to `main`.
- Build step passes before deployment (validates deployability).

## Implementation order
1. Create Vercel project + connect repo.
2. Configure production domain + DNS.
3. Set up GitHub Actions secrets (`VERCEL_API_TOKEN`; optionally `VERCEL_ORG_ID`/`VERCEL_PROJECT_ID`).
4. Create `.github/workflows/deploy-production.yml` workflow.
5. Add minimal landing page shell (server-rendered; fast; accessible).
6. Validate production deploy and document the production URL in the PR description.
7. Verify CD workflow: merge trivial change to `main`, confirm auto-deploy.

## Behavioral tests
- Visiting https://tally-tracker.app returns HTTP 200 and renders headline + primary CTA.
- Primary CTA works on mobile + desktop breakpoints.
