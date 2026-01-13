# Grafana Cloud + OpenTelemetry integration plan (Tally)

## Goals
- Add **vendor-neutral observability** across **Web (Next.js on Vercel)**, **iOS**, and **Android** using **OpenTelemetry (OTel)**.
- Use **Grafana Cloud** as the single back-end for:
  - **Traces** (Tempo)
  - **Logs** (Loki)
  - **Metrics** (Mimir/Prometheus)
- Be **IaC-first**: everything repeatable (Grafana resources + Vercel env vars + dashboards/alerts), minimal clickops.
- Complement existing tooling:
  - **Sentry** stays the “errors + release health + app perf UX” tool.
  - **PostHog** stays “product analytics”.
  - **OTel + Grafana** becomes “distributed tracing + infra metrics + operational logs + cross-service correlation”.

## Non-goals
- Replacing Sentry performance monitoring immediately.
- Full real-user monitoring (RUM) and session replay (we already have Sentry; PostHog also has autocapture). If we later want RUM in Grafana, evaluate **Grafana Faro** separately.

---

## 0) Target architecture (high level)

### Data flows
1. **Next.js server/runtime (Vercel functions)**
   - OTel SDK generates **spans** + **trace context**.
   - Export via **OTLP/HTTP** directly to Grafana Cloud OTLP endpoint.

2. **Web client (browser)**
   - Optional initially; by default we focus on server-side traces.
   - If we later add client tracing: send to Grafana Cloud OTLP, but be careful with PII + sampling.

3. **iOS + Android**
   - OTel SDK (mobile) creates spans for app start, navigation, network.
   - Export via **OTLP/HTTP** to Grafana Cloud.

4. **Logs**
   - App logs remain structured console logs; shipping strategy differs by platform:
     - Vercel logs: use **Vercel Log Drains** → Grafana Cloud Logs endpoint (Loki).
     - Mobile logs: optionally export OTel Logs via OTLP (or ship via a lightweight backend if needed).

### Why direct-to-cloud (initially)
- We don’t control always-on servers in Vercel to run a Collector.
- Direct OTLP export keeps the first milestone small.

### Future option: OTel Collector (recommended later)
If we add a small always-on component (e.g., Fly.io, ECS, K8s, or a managed collector), we can:
- Normalize attributes
- Centralize sampling/tail-based sampling
- Filter PII
- Retry/buffering

---

## 1) Grafana Cloud: what we need

### 1.1 Create/confirm a Grafana Cloud “stack”
- Pick the region closest to most users (EU/US decision).
- Enable:
  - **Tempo** (traces)
  - **Loki** (logs)
  - **Mimir/Prometheus** (metrics)

### 1.2 Access policies/tokens (least privilege)
Create **separate tokens** per signal and/or environment (recommended):
- `tally-otel-traces-prod` (write traces)
- `tally-otel-metrics-prod` (write metrics)
- `tally-otel-logs-prod` (write logs)
- Repeat for `staging`/`dev` if we run multiple envs.

Store tokens as **Pulumi secrets** (never in git).

### 1.3 Standardize endpoints + auth format
We will use **OTLP over HTTP** everywhere (simplest across Vercel + mobile).

**OTLP endpoint (multi-zone, production)**
- Endpoint for sending OTLP signals (traces/metrics/logs):
  - `https://otlp-gateway-prod-gb-south-1.grafana.net/otlp`
- This instance includes a **multi-zone OTLP endpoint** that enhances ingestion reliability.
  - Keep the endpoint centralized in IaC (Pulumi config) so we can rotate/change it without code changes.

**Instance ID**
- Grafana Cloud instance ID: `1491410`

**Auth (Password / API Token)**
- Generate a Grafana Cloud **API token** first.
- Provide auth to SDKs via headers:
  - `OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64(1491410:<token>)>`
- The Grafana Cloud UI will also show suggested **environment variables** once a token exists; mirror those via Pulumi-managed env vars.

**Protocol support**
- Only **HTTP** is supported for sending OTLP signals (do not use gRPC exporters).

**Language guides**
- Use Grafana’s language-specific instrumentation guides (Java, .NET, etc.) as reference; ensure the exporter is configured for **OTLP/HTTP**.

If anything is unclear, Grafana Cloud Support can confirm the correct header format/token scopes for this stack.

---

## 2) Semantic conventions + correlation (critical)

### 2.1 Required resource attributes
Apply consistently across all apps:
- `service.name`: `tally-web`, `tally-ios`, `tally-android`
- `deployment.environment`: `development` | `preview` | `staging` | `production`
- `service.version`: git SHA or SemVer (match Sentry release where possible)
- `telemetry.sdk.language`: auto

Recommended:
- `service.namespace`: `tally`
- `device.*` / `os.*` for mobile

### 2.2 Trace/log correlation
- Ensure logs include `trace_id` and `span_id` when available.
- In Node/Next.js, prefer a logger that can read OTel context and inject IDs into structured logs.

### 2.3 User identity + privacy
- Do **not** export email, names, or free-text notes.
- If we attach user identity to traces, use:
  - `enduser.id = <stable id>` (e.g., Clerk user id)
  - Consider hashing if needed.

### 2.4 Align release identifiers with Sentry
Pick one release format used everywhere:
- `tally@<semver>+<gitsha>`

Set both:
- OTel: `service.version`
- Sentry: `release`

---

## 3) IaC strategy (Pulumi in `infra/`)

### 3.1 Principle
- **All** Grafana Cloud setup and **all** Vercel env wiring is managed via **Pulumi**.

### 3.2 Pulumi configuration (secrets)
Pulumi does **not** automatically read the root `.env`, so we explicitly copy values into the Pulumi stack config.

Store in Pulumi config:
- Grafana Cloud:
  - `grafanaCloudInstanceId` (non-secret; `1491410`)
  - `grafanaCloudOtlpEndpoint` (non-secret; `https://otlp-gateway-prod-gb-south-1.grafana.net/otlp`)
  - `grafanaCloudAdminToken` (**secret**; set from `.env` `GRAFANA_CLOUD_ADMIN_TOKEN`)
  - `grafanaCloudOtlpToken` (**secret**; a dedicated ingest token for OTLP writes)

Example:

```bash
cd infra

# From root .env (you already added this)
pulumi config set --secret grafanaCloudAdminToken "$GRAFANA_CLOUD_ADMIN_TOKEN"

pulumi config set grafanaCloudInstanceId 1491410
pulumi config set grafanaCloudOtlpEndpoint https://otlp-gateway-prod-gb-south-1.grafana.net/otlp

# After you generate an OTLP ingest token
pulumi config set --secret grafanaCloudOtlpToken "$GRAFANA_CLOUD_OTLP_TOKEN"
```

### 3.3 Provision Grafana resources via IaC
Two viable approaches:

**A) Pulumi + Grafana provider (now implemented)**

The `infra/index.ts` now uses the `@pulumiverse/grafana` provider to manage:
- **Folders**: "Tally Application" and "Tally Alerts" folders
- **Dashboards**:
  - "Tally Web - Overview": Request rate, error rate, P95 latency, traces, and recent logs
  - "Tally - Logs Explorer": Log volume by level, error logs, and all logs

The provider requires `grafanaCloudAdminToken` to be set:

```bash
cd infra
export PULUMI_ACCESS_TOKEN=$(grep PULUMI_ACCESS_TOKEN ../.env | cut -d= -f2)

# Set admin token for prod stack
pulumi config set --secret --stack prod tally-infra:grafanaCloudAdminToken \
  $(grep GRAFANA_CLOUD_ADMIN_TOKEN ../.env | cut -d= -f2)

# Preview changes
pulumi preview --stack prod

# Apply changes
pulumi up --stack prod
```

**Grafana Cloud URL**: https://tallytracker.grafana.net

The dashboards use:
- `grafanacloud-prom` datasource for metrics (Prometheus/Mimir)
- `grafanacloud-logs` datasource for logs (Loki)

**B) Pulumi + `@pulumi/command` calling Grafana Cloud APIs (fallback)**
- Mirrors the existing pattern used for Clerk redirect URLs.
- Idempotent “GET-or-create” commands.

### 3.4 Provision Vercel env vars via IaC
Following the existing pattern in `infra/index.ts` with `vercel.ProjectEnvironmentVariable`:

Set (production target initially):
- `OTEL_SERVICE_NAME=tally-web`
- `OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf`
- `OTEL_EXPORTER_OTLP_ENDPOINT=<grafana cloud otlp endpoint>`
- `OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <...>` (**secret**)
- `OTEL_RESOURCE_ATTRIBUTES=deployment.environment=production,service.namespace=tally`
- `OTEL_TRACES_SAMPLER=parentbased_traceidratio`
- `OTEL_TRACES_SAMPLER_ARG=0.1` (start conservative)

Optional:
- `OTEL_LOG_LEVEL=info`

> Keep the env var set minimal and consistent; prefer `OTEL_RESOURCE_ATTRIBUTES` for common attrs.

---

## 4) Web (Next.js on Vercel) implementation

### 4.1 What we instrument (phase 1)
- **Server-side tracing**:
  - Route handlers / server actions
  - Outbound fetch calls (to external services)
  - Internal app spans around key operations

### 4.2 How we instrument
- Use OTel for Node/Next.js with an OTLP exporter.
- Ensure it works with Vercel runtime constraints (no UDP exporters; use HTTP).

Implementation notes:
- Add a single OTel init path that runs early.
- Avoid heavy auto-instrumentation at first; start with minimal manual spans + fetch instrumentation.

### 4.3 Logging on Vercel
Two parallel tracks:

**A) Fast path: Vercel Log Drains → Grafana Cloud Loki**
- Configure log drain to Grafana Cloud’s logs ingest endpoint.
- Parse/enrich logs in Grafana (or later via collector).

**B) App-level structured logs (recommended)**
- Emit JSON logs with:
  - `level`, `msg`, `service`, `env`, `release`
  - `trace_id`, `span_id` when present

### 4.4 Metrics
- Start with default runtime metrics if easy.
- Add custom counters/histograms only for critical paths.

---

## 5) iOS implementation

### 5.1 SDK choice
- Use OpenTelemetry Swift SDK + OTLP exporter over HTTP.

### 5.2 What we instrument (phase 1)
- App start (cold/warm)
- Screen navigation (key screens)
- Network calls (URLSession)
- Background sync (if applicable)

### 5.3 Configuration
- Configure exporter endpoint + headers via build config (not hardcoded):
  - `.xcconfig` / build settings for endpoint
  - Secrets injected via CI for production

### 5.4 Privacy
- Never attach request/response bodies.
- Avoid user-entered note content.

---

## 6) Android implementation

### 6.1 SDK choice
- Use OpenTelemetry Java/Kotlin SDK + OTLP exporter (HTTP).

### 6.2 What we instrument (phase 1)
- App start
- Compose navigation spans for key flows
- OkHttp instrumentation via interceptor (or manual wrappers)

### 6.3 Configuration
- Use Gradle buildConfigFields or resources for endpoint.
- Secrets injected via CI for production.

---

## 7) Environment strategy

Recommended:
- Use **one Grafana stack** and distinguish environments via `deployment.environment`.
- Vercel preview deployments can use:
  - lower sampling
  - separate token (optional)

---

## 8) Rollout plan (safe, incremental)

### Milestone 1 — Grafana Cloud + IaC foundations
1. Decide region + create stack.
2. Create access policies/tokens.
3. Add Pulumi config/secrets.
4. Provision Vercel env vars via Pulumi.

**Exit criteria**: a hello-world span from Next.js server arrives in Tempo.

### Milestone 2 — Web server tracing (high value)
1. Add OTel init + minimal instrumentation.
2. Add correlation-friendly structured logs.
3. Create a “Web Ops” dashboard in Grafana:
   - trace rate
   - error rate (from logs)
   - latency percentiles

**Exit criteria**: traces show route spans and at least one outbound dependency span.

### Milestone 3 — Logs pipeline
1. Configure Vercel Log Drain → Loki.
2. Ensure trace/log correlation is visible.

**Exit criteria**: a trace in Tempo can be linked to relevant logs in Loki.

### Milestone 4 — Mobile (when apps mature)
1. Add OTel SDKs to iOS + Android.
2. Instrument navigation + network.
3. Add mobile dashboards and alerts.

---

## 9) Alerts & dashboards (minimum viable)
Create via IaC:
- Tempo:
  - sudden drop in trace ingest (instrumentation broken)
  - latency p95 threshold on key server operations
- Loki:
  - error log rate spike
- Mimir:
  - request rate / latency histograms (if implemented)

---

## 10) Acceptance checklist
- Traces appear for:
  - web server request
  - outbound call span
- `service.name`, `deployment.environment`, and `service.version` set correctly.
- No PII is exported.
- Vercel env vars are managed in Pulumi (repeatable).
- We can navigate from a trace → correlated logs.

---

## 11) Open questions to decide early
1. Grafana Cloud region (EU vs US)?
2. Do we want separate stacks per environment, or a single stack with env labels?
3. Sampling policy target for production (start at 10%?)
4. Do we want client-side web tracing at all, given Sentry already covers a lot?
