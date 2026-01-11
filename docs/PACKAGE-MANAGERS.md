# Package Manager Policy

This document defines the package manager boundaries for the Tally monorepo.

## Workspace Rules

| Directory | Package Manager | Lockfile | Notes |
|-----------|-----------------|----------|-------|
| `/` (root) | npm | `package-lock.json` | Nx tooling only |
| `tally-web/` | **bun** | `bun.lockb` | Next.js web app |
| `infra/` | npm | `package-lock.json` | Pulumi infrastructure |
| `packages/*/` | (workspace) | none | Inherit from root |

## Why This Matters

1. **Reproducible builds**: Each workspace has exactly one package manager
2. **CI consistency**: CI knows which commands to run where
3. **Fewer conflicts**: No mixed lockfile merges

## CI Enforcement

The CI pipeline includes a `lockfile-guards` job that fails if:

- `tally-web/package-lock.json` exists (should use bun)
- `infra/bun.lockb` exists (should use npm)
- Any `packages/*/` has its own lockfile

## Quick Reference

```bash
# Web app (Next.js)
cd tally-web
bun install
bun run dev
bun run build
bun run test

# Infrastructure (Pulumi)
cd infra
npm install
npm run typecheck
pulumi preview

# Root (Nx tooling)
# Only used for Nx workspace commands
npm install  # at root
```

## Tool Versions

For consistent environments across developers, we recommend:

- **Node.js**: 20.x LTS
- **Bun**: 1.1.36+
- **npm**: 10.x (comes with Node 20)

You can use a version manager like:
- [volta](https://volta.sh/) - recommended
- [asdf](https://asdf-vm.com/) with nodejs/bun plugins
- [nvm](https://github.com/nvm-sh/nvm) for Node only

## Common Mistakes

### ❌ Don't do this
```bash
# Wrong: npm in tally-web
cd tally-web
npm install  # Creates package-lock.json!

# Wrong: bun in infra
cd infra
bun install  # Creates bun.lockb!
```

### ✅ Do this instead
```bash
# Correct: bun in tally-web
cd tally-web
bun install

# Correct: npm in infra  
cd infra
npm install
```

## Troubleshooting

### "Wrong lockfile exists"

If CI fails with this error:

1. Delete the wrong lockfile:
   ```bash
   rm tally-web/package-lock.json  # if this is the problem
   # or
   rm infra/bun.lockb              # if this is the problem
   ```

2. Run the correct package manager:
   ```bash
   cd tally-web && bun install
   # or
   cd infra && npm install
   ```

3. Commit and push

### Dependency conflicts

If you need to update a shared dependency:

1. Update in the appropriate lockfile
2. Test locally with `bun install --frozen-lockfile` (web) or `npm ci` (infra)
3. Verify CI passes before merging
