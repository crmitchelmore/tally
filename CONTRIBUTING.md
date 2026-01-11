# Contributing to Tally

## Development Environment

- **Web App**: Uses [Bun](https://bun.sh)
- **Infrastructure**: Uses `npm` + [Pulumi](https://www.pulumi.com)

## Quick Start

```bash
# Web App
cd tally-web
bun install
bun run dev

# Infrastructure
cd infra
npm install
pulumi preview
```

## Critical Rules

1. **Infrastructure**: All infrastructure changes MUST be made via Pulumi (`cd infra && pulumi up`). Never change resources manually in dashboards.
2. **Authentication**: Use `clerkMiddleware()` in `proxy.ts`.
3. **Database**: Never trust client-provided `userId`. Always use `ctx.auth.getUserIdentity()`.

## Branching Strategy

- `main`: Production (Protected)
- `develop`: Development (Protected)
- Feature branches: `feat/`, `fix/`, `consultant/`

## Pull Request Process

1. Ensure all tests pass: `bun run test`
2. Update documentation if necessary.
3. Describe your changes clearly in the PR template.
