# Tally

Tally is a **friendly, fast, multi-platform** challenge/progress tracker inspired by classic tally marks.

- **Production:** https://tally-tracker.app
- **CI:** https://github.com/crmitchelmore/tally/actions

## Repo layout
- `tally-web/` — Next.js 16 + React 19 web app (package manager: **Bun**)
- `infra/` — Pulumi TypeScript (package manager: **npm**)
- `tally-ios/` — iOS app (Swift) (WIP)
- `tally-android/` — Android app (Kotlin) (WIP)
- `docs/` — mental model, design philosophy, migration plan

## Tech stack
- Web: Next.js (App Router), Tailwind, shadcn/ui
- Backend/DB: Convex
- Auth: Clerk
- Hosting: Vercel
- DNS: Cloudflare
- IaC: Pulumi
- Landing page UX: Convex.dev-inspired **live preview videos** (MP4/WebM, autoplay/hover-play) + an **interactive micro-demo** to show how the app works
- Observability:
  - Sentry (errors + performance UX)
  - PostHog (product analytics)
  - Grafana Cloud + OpenTelemetry (traces/logs/metrics)

## Quickstart

### Web
```bash
cd tally-web
bun install
bun run dev
```

### Tests
```bash
cd tally-web
bun run lint
bun run test
```

### Infrastructure (Pulumi)
> Infra changes must go through Pulumi (no dashboard clickops).

```bash
cd infra
npm ci
pulumi preview
pulumi up
```

## Configuration & secrets
- Local development uses a root `.env` file (gitignored).
- CI uses GitHub Actions secrets; see `.github/workflows/*.yml` for required names.

## Observability
- Grafana Cloud + OTel plan: [`grafana-cloud-otel.md`](grafana-cloud-otel.md)
- Sentry plan: [`sentry integration.md`](sentry%20integration.md)
- PostHog plan: [`posthog.md`](posthog.md)

## Docs
- Project context: [`CONTEXT.md`](CONTEXT.md)
- Mental model: [`docs/MENTAL-MODEL.md`](docs/MENTAL-MODEL.md)
- Design philosophy: [`docs/DESIGN-PHILOSOPHY.md`](docs/DESIGN-PHILOSOPHY.md)
- Marketing + app store assets: [`docs/MARKETING.md`](docs/MARKETING.md)

## Security
See [`SECURITY.md`](SECURITY.md).

## License
MIT — see [`LICENSE`](LICENSE).
