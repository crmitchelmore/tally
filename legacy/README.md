# Legacy Vite/Spark App

⚠️ **DEPRECATED** - This directory contains the original Vite + React + GitHub Spark prototype.

The production application is now in [`../tally-web/`](../tally-web/) using Next.js 16 + Convex + Clerk.

## Contents

- `src/` - Original React components (superseded by `tally-web/src/`)
- `vite.config.ts` - Vite bundler configuration
- `index.html` - Vite entry point
- `tailwind.config.js` - Tailwind configuration (now in `tally-web/`)
- `components.json` - shadcn/ui configuration (now in `tally-web/`)
- `theme.json` - Original theme configuration
- `spark.meta.json` - GitHub Spark metadata
- `runtime.config.json` - Spark runtime config

## Why keep this?

Preserved for reference during migration. Can be safely deleted once migration is confirmed complete.

## Migration Status

See [`docs/migration/README.md`](../docs/migration/README.md) for current progress.
