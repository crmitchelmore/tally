# @tally/shared-types

Shared TypeScript types that mirror the Convex schema (for web + mobile).

## Usage (TypeScript)

```ts
import type { Challenge, Entry, TimeframeUnit, FeelingType } from "@tally/shared-types";

const unit: TimeframeUnit = "year";
const feeling: FeelingType = "moderate";

function renderChallenge(c: Challenge) {
  return `${c.name} (${c.year})`;
}

function total(entries: Entry[]) {
  return entries.reduce((sum, e) => sum + e.count, 0);
}
```

## JSON Schema (non-TypeScript clients)

A JSON Schema is provided for non-TypeScript clients:

- `schema.json` (definitions under `$defs`, e.g. `Challenge`, `Entry`, `User`)

Example `$ref`:

```json
{ "$ref": "schema.json#/$defs/Challenge" }
```

### Schema validation (manual)

If you want to validate example payloads during development:

```bash
npx ajv-cli validate \
  -s packages/shared-types/schema.json \
  -d path/to/payload.json \
  --spec=draft2020
```

