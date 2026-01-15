# Feature: Landing page + web app — CD (deploy early)

## Goal
Be able to deploy a "hello world" version of the landing page and the web app to **production** immediately, so copy/CTA can be reviewed on a real URL and iterated quickly.

## Scope
- Create/confirm Vercel project(s) for the landing page and web app.
- Configure production domain + HTTPS.
- Configure required environment variables (minimize secrets; use Vercel env vars, not committed files).
- Ensure **merge to default branch** triggers a production deploy (CD).
- Add a minimal `/` route (or equivalent) that renders a "hello world" landing page shell.
- Add/confirm a minimal `/app` route (or equivalent) that renders a "hello world" web app shell.

## Non-goals (this is for later)
- Full CI suite (lint/test/perf/a11y gating)
- Branch protection / PR gating (we’re explicitly not requiring PRs right now)

## Acceptance criteria
- A production URL exists and serves the landing page.
- A trivial copy change merged to the default branch results in an updated production deploy.
- Deployment status is visible (Vercel dashboard and/or commit status).

## Implementation order
1. Create Vercel project + connect repo.
2. Configure production domain + DNS.
3. Add minimal landing page shell (server-rendered; fast; accessible).
4. Validate production deploy and document the production URL in the PR description.

## Behavioral tests
- Visiting the production URL returns HTTP 200 and renders headline + primary CTA.
- Primary CTA works on mobile + desktop breakpoints.
