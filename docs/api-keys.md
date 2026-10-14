# Integration API keys

Implemented locally; deploying Next.js alone is insufficient. The existing `.github/workflows/deploy-production.yml` runs on main pushes or manual dispatch and currently deploys Vercel before Convex: review that ordering for this additive backend dependency before release. This task has not pushed, dispatched or modified that workflow. Deploy the Convex schema/functions first through the project's approved workflow, regenerate Convex types, then deploy the matching web release. Validate on an isolated development account before production. No deployment or live key issuance is implied by this document.

## Safe release gate

The production workflow currently installs dependencies, builds web, deploys **Vercel production**, deploys **Convex**, then runs homepage/health/unauthenticated-API smoke tests. It is independently triggered on main pushes; CI is not a prerequisite in that workflow. Those smoke tests do not verify API-key issuance, scopes, or idempotency. Do not merge this feature into main and assume the current ordering is safe.

1. Review/approve a release-workflow change: retain the credential-backed build gate, add unit tests/typecheck, then deploy the additive Convex schema/functions **before** the matching Vercel release. Verify Convex target and `NEXT_PUBLIC_CONVEX_URL` describe the same production deployment. Do not publish the new UI first.
2. Regenerate/review Convex types in the normal development environment and run isolated-account end-to-end issuance/read/write/replay/conflict/revoke checks before production approval. Check concurrent identical events create one entry, invalid/scope/cross-owner requests fail, and revoked keys cannot replay.
3. Release the approved commit through the corrected workflow and verify production capability checks on an owner-controlled test challenge. Old web remains compatible with the additive backend; if web rollout fails, keep that backend and restore the prior web release rather than deleting key/receipt tables.
4. Only after release, the signed-in owner generates the integration key in Settings with the two required scopes, stores it directly in a secret manager, and selects the intended challenge ID. Local generation alone is not a live owned key; never paste the secret into chat.

Local verification on 2026-10-14: installed `tsc --noEmit --incremental false` passed; installed Vitest passed 109 tests across 12 files; installed `next build` passed with synthetic public Clerk/Convex configuration and no live credentials. Bun was unavailable in the local shell, so installed binaries were invoked directly. A build with all public config empty failed as expected at the existing Convex configuration guard. The installed OTel logger processor takes the exporter directly; its constructor call was minimally corrected. Existing dependency/deprecation/image lint warnings remain nonfatal. None of these checks prove a deployment or live credential issuance.

## Owner setup

Sign in to Tally and open **Settings → Manage integration API keys** (`/app/settings/api-keys`). Enter an integration name and explicitly select permissions:

- `challenges:read`: `GET /api/v1/challenges` — only the owner's challenges and progress (same response shape as existing clients).
- `entries:write`: `POST /api/v1/entries` — add entries only to the owner's challenges. No edit/delete/export/account/key-management access.

Generation requires an authenticated Clerk session and same-origin request. Each key contains 32 cryptographically random bytes. The full key is returned once with `Cache-Control: no-store` and held only in page memory; lists show its name, short prefix, scopes and revocation status. Convex stores the SHA-256 digest, never the plaintext. A digest can be registered only once globally, even after revocation; duplicate registrations (including concurrent owners) are rejected atomically so no owner can shadow an existing capability. Store the full key in a secret manager; never send it in chat, commit it, put it in URLs or enable request/response-body logging on these routes. Revocation applies to subsequent queries/mutations, including replays. Account deletion removes keys and receipts. Maximum 20 active keys per owner.

The digest is a sensitive verifier/capability at the database boundary: protect database backups/admin access and never expose digests in exports or logs. Convex capability functions deliberately accept only the verifier, independently enforce scope and derive the owner from the stored key; they do not impersonate Clerk or trust a submitted user ID.

## Connector requests

Supply `Authorization: Bearer <key from secret manager>`. Existing Clerk cookie and native Bearer JWT clients remain supported; API keys work only on the two method/path pairs above and take precedence there even when browser cookies are present. Invalid keys do not fall back to the browser's identity.

Safe conceptual example (not a runnable shell command with secrets in arguments):

```http
POST /api/v1/entries
Authorization: Bearer <loaded securely at runtime>
Content-Type: application/json

{
  "challengeId": "<owner-selected challenge ID>",
  "date": "2026-10-14",
  "timeZone": "Europe/London",
  "count": 1,
  "externalEventId": "mobility:provider-account:stable-session-id"
}
```

Use the event's local calendar date and explicit IANA `timeZone`; omitting timezone retains legacy UTC future-date validation. Keys require a stable `externalEventId` of 1–200 characters. Prefix it with connector/provider/account identity: the uniqueness boundary is **owner + event ID**, not key or challenge, so rotation does not duplicate events. Entries and immutable receipts are written in a single serializable Convex mutation. Identical canonical payloads replay with HTTP 200 and `replayed:true`; first writes return 201 and `replayed:false`; changing challenge/date/count/note/feeling/sets for the same event returns 409 `EVENT_CONFLICT`. Different owners may reuse an ID. Empty/omitted sets and absent optional fields normalize equivalently. Deleting an entry does not delete its receipt: replay returns the original creation snapshot without recreating a deleted entry. Replaying after challenge deletion is rejected. Receipts last until account deletion.

Session clients can optionally send `externalEventId` too; clients that omit it retain additive entry creation. No mobility challenge mapping is assumed and no real habit completions have been written.

## Management API (session only)

`GET /api/v1/api-keys` lists safe metadata; `POST` takes `{name,scopes}` and returns `{id,key,prefix}` once; `DELETE` takes `{id}` to revoke an owned key. Browser writes must include the same-origin Origin header. API keys cannot create/revoke other keys.

## Verification

Run `bun run test`; tests exercise direct Convex isolation, scopes, revocation, concurrent deduplication/conflict, rotation, deletion, legacy clients and owner-authenticated management. Typecheck with `tsc --noEmit --incremental false`. Live issuance must happen after deployment in the signed-in owner's UI, not by generating an unowned offline string or copying a session token.
