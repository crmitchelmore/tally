import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import * as vercel from "@pulumiverse/vercel";
import * as command from "@pulumi/command";
import * as launchdarkly from "@lbrlabs/pulumi-launchdarkly";

// =============================================================================
// Stack-aware Configuration
// =============================================================================
const stack = pulumi.getStack();
const isProd = stack === "prod";
const config = new pulumi.Config();

// Base domain and stack-specific subdomain
const baseDomain = "tally-tracker.app";

const domain = isProd ? baseDomain : `dev.${baseDomain}`;
const zoneId = "816559836db3c2e80112bd6aeefd6d27";
const vercelProjectId = "prj_tXdIJDmRB1qKZyo5Ngat62XoaMgw";
const vercelTeamId = "team_ifle7fkp7usKufCL8MUCY1As";

// Vercel target environment based on stack
const vercelTarget = isProd ? "production" : "development";

// Sentry configuration
const sentryOrg = "tally-lz";
const sentryAdminToken = config.getSecret("sentryAdminToken");

// Manage the existing Vercel project (only in prod stack to avoid conflicts)
let vercelProject: vercel.Project | undefined;
if (isProd) {
  vercelProject = new vercel.Project("tally-web-project", {
    teamId: vercelTeamId,
    name: "tally-web",
    framework: "nextjs",
    rootDirectory: "tally-web",
    autoAssignCustomDomains: true,
  });
}

// Clerk configuration
// In prod stack: use prod keys for production, dev keys for preview/development
// In dev stack: use the stack's keys (which are dev instance keys)
const clerkSecretKey = config.requireSecret("clerkSecretKey");
const clerkPublishableKey = config.getSecret("clerkPublishableKey");
// Only needed in prod stack for preview/development targets
const clerkSecretKeyDev = isProd ? config.getSecret("clerkSecretKeyDev") : undefined;
const clerkPublishableKeyDev = isProd ? config.getSecret("clerkPublishableKeyDev") : undefined;

// Convex configuration
const convexDeployment = config.get("convexDeployment");

// =============================================================================
// Clerk Environment Variables (stack-aware)
// =============================================================================

if (isProd) {
  // Production stack manages both prod and dev/preview Vercel targets

  // Production Clerk keys
  if (clerkPublishableKey) {
    new vercel.ProjectEnvironmentVariable(
      "clerk-publishable-key-prod",
      {
        projectId: vercelProjectId,
        teamId: vercelTeamId,
        key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        value: clerkPublishableKey,
        targets: ["production"],
      },
      { deleteBeforeReplace: true }
    );
  }

  new vercel.ProjectEnvironmentVariable(
    "clerk-secret-key-prod",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "CLERK_SECRET_KEY",
      value: clerkSecretKey,
      targets: ["production"],
    },
    { deleteBeforeReplace: true }
  );

  // Dev/Preview Clerk keys (separate Clerk instance)
  if (clerkPublishableKeyDev) {
    new vercel.ProjectEnvironmentVariable(
      "clerk-publishable-key-dev",
      {
        projectId: vercelProjectId,
        teamId: vercelTeamId,
        key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
        value: clerkPublishableKeyDev,
        targets: ["preview", "development"],
      },
      { deleteBeforeReplace: true }
    );
  }

  if (clerkSecretKeyDev) {
    new vercel.ProjectEnvironmentVariable(
      "clerk-secret-key-dev",
      {
        projectId: vercelProjectId,
        teamId: vercelTeamId,
        key: "CLERK_SECRET_KEY",
        value: clerkSecretKeyDev,
        targets: ["preview", "development"],
      },
      { deleteBeforeReplace: true }
    );
  }
}

// =============================================================================
// Convex Environment Variables (stack-aware)
// =============================================================================

if (convexDeployment) {
  // Strip env prefix (dev:, prod:) to get the deployment slug
  const deploymentSlug = convexDeployment.replace(/^(dev|prod):/, "");
  const convexUrl = `https://${deploymentSlug}.convex.cloud`;
  
  // Target based on stack
  const targets: ("production" | "preview" | "development")[] = isProd 
    ? ["production"] 
    : ["development"];

  new vercel.ProjectEnvironmentVariable(
    `convex-deployment-${stack}`,
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "CONVEX_DEPLOYMENT",
      value: convexDeployment,
      targets,
    },
    { deleteBeforeReplace: true }
  );

  new vercel.ProjectEnvironmentVariable(
    `convex-url-${stack}`,
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "NEXT_PUBLIC_CONVEX_URL",
      value: convexUrl,
      targets,
    },
    { deleteBeforeReplace: true }
  );
}

// =============================================================================
// Cloudflare DNS Records (stack-aware)
// =============================================================================

let rootRecord: cloudflare.DnsRecord | undefined;
let wwwRecord: cloudflare.DnsRecord | undefined;
let vercelTxtRecord: cloudflare.DnsRecord | undefined;
let devRecord: cloudflare.DnsRecord | undefined;

if (isProd) {
  // Production: Root domain and www
  rootRecord = new cloudflare.DnsRecord("root-record", {
    zoneId: zoneId,
    name: "@",
    type: "A",
    content: "76.76.21.21", // Vercel's IP
    proxied: false,
    ttl: 1,
  });

  wwwRecord = new cloudflare.DnsRecord("www-record", {
    zoneId: zoneId,
    name: "www",
    type: "CNAME",
    content: "cname.vercel-dns.com",
    proxied: false,
    ttl: 1,
  });

  vercelTxtRecord = new cloudflare.DnsRecord("vercel-txt-record", {
    zoneId: zoneId,
    name: "_vercel",
    type: "TXT",
    content: "vc-domain-verify=tally-tracker.app,90cf862f53bce1742529,dc",
    ttl: 1,
  });
} else {
  // Dev stack: dev subdomain
  devRecord = new cloudflare.DnsRecord("dev-record", {
    zoneId: zoneId,
    name: "dev",
    type: "CNAME",
    content: "cname.vercel-dns.com",
    proxied: false,
    ttl: 1,
  });
}

// =============================================================================
// Vercel Domain Configuration (stack-aware)
// =============================================================================

let vercelDomain: vercel.ProjectDomain | undefined;
let vercelWwwDomain: vercel.ProjectDomain | undefined;
let vercelDevDomain: vercel.ProjectDomain | undefined;

if (isProd) {
  // Production: Root domain and www redirect
  vercelDomain = new vercel.ProjectDomain("tally-domain", {
    projectId: vercelProjectId,
    teamId: vercelTeamId,
    domain: baseDomain,
  });

  vercelWwwDomain = new vercel.ProjectDomain("tally-www-domain", {
    projectId: vercelProjectId,
    teamId: vercelTeamId,
    domain: `www.${baseDomain}`,
    redirect: baseDomain,
    redirectStatusCode: 308,
  });
} else {
  // Dev stack: dev subdomain
  vercelDevDomain = new vercel.ProjectDomain("tally-dev-domain", {
    projectId: vercelProjectId,
    teamId: vercelTeamId,
    domain: domain, // dev.tally-tracker.app
  });
}

// =============================================================================
// Clerk Redirect URLs (stack-aware)
// =============================================================================

// Build redirect URLs for this stack's domain
const clerkRedirectUrls = [
  `https://${domain}`,
  `https://${domain}/app`,
  `https://${domain}/sign-in/sso-callback`,
  `https://${domain}/sign-up/sso-callback`,
];

// Add www redirects only for prod
if (isProd) {
  clerkRedirectUrls.push(
    `https://www.${baseDomain}`,
    `https://www.${baseDomain}/app`,
    `https://www.${baseDomain}/sign-in/sso-callback`,
    `https://www.${baseDomain}/sign-up/sso-callback`
  );
}

// Add localhost for dev stack
if (!isProd) {
  clerkRedirectUrls.push(
    "http://localhost:3000",
    "http://localhost:3000/app",
    "http://localhost:3000/sign-in/sso-callback",
    "http://localhost:3000/sign-up/sso-callback"
  );
}

// Create Clerk redirect URLs using the API
const clerkRedirectUrlResources = clerkRedirectUrls.map((url, index) => {
  return new command.local.Command(`clerk-redirect-url-${stack}-${index}`, {
    create: pulumi.interpolate`ID=$(curl -s "https://api.clerk.com/v1/redirect_urls" \
      -H "Authorization: Bearer ${clerkSecretKey}" | jq -r '.[] | select(.url=="${url}") | .id' | head -n 1) && \
      if [ -n "$ID" ] && [ "$ID" != "null" ]; then echo "$ID"; else \
      curl -s -X POST "https://api.clerk.com/v1/redirect_urls" \
        -H "Authorization: Bearer ${clerkSecretKey}" \
        -H "Content-Type: application/json" \
        -d '{"url": "${url}"}' | jq -r '.id // empty'; fi`,
    delete: pulumi.interpolate`ID=$(curl -s "https://api.clerk.com/v1/redirect_urls" \
      -H "Authorization: Bearer ${clerkSecretKey}" | jq -r '.[] | select(.url=="${url}") | .id' | head -n 1) && \
      [ -n "$ID" ] && [ "$ID" != "null" ] && curl -s -X DELETE "https://api.clerk.com/v1/redirect_urls/$ID" \
      -H "Authorization: Bearer ${clerkSecretKey}" || true`,
    environment: {},
  });
});

// =============================================================================
// LaunchDarkly Configuration
// =============================================================================

// TEMPORARILY DISABLED: The @lbrlabs/pulumi-launchdarkly provider v0.0.6 has a bug
// that causes crashes during diff operations. LaunchDarkly resources are managed
// manually in the dashboard until a fixed provider version is available.
// 
// See: https://github.com/lbrlabs/pulumi-launchdarkly/issues/XX
//
// To re-enable:
// 1. Update @lbrlabs/pulumi-launchdarkly to a fixed version
// 2. Uncomment the resources below
// 3. Run `pulumi import` if needed

/*
const ldProject = new launchdarkly.Project("tally-ld-project", {
  key: "tally",
  name: "Tally",
  tags: ["pulumi"],
  environments: [
    { key: "dev", name: "Development", color: "7B68EE", tags: ["pulumi"] },
    { key: "preview", name: "Preview", color: "FFA500", tags: ["pulumi"] },
    { key: "prod", name: "Production", color: "32CD32", tags: ["pulumi"] },
  ],
  defaultClientSideAvailabilities: [{ usingEnvironmentId: true, usingMobileKey: true }],
});

const streaksEnabledFlag = new launchdarkly.FeatureFlag("streaks-enabled-flag", {
  projectKey: ldProject.key,
  key: "streaks-enabled",
  name: "Streaks Enabled",
  description: "Enable streak tracking feature across all platforms",
  variationType: "boolean",
  variations: [
    { value: "false", name: "Disabled" },
    { value: "true", name: "Enabled" },
  ],
  defaults: { onVariation: 1, offVariation: 0 },
  tags: ["pulumi", "rollout"],
  clientSideAvailabilities: [{ usingEnvironmentId: true, usingMobileKey: true }],
});
*/

// Placeholder exports for disabled LD resources
const ldProject = { key: "tally" };
const streaksEnabledFlag = { key: "streaks-enabled" };

// Get SDK keys from the project environments
// Note: SDK keys are auto-generated by LaunchDarkly when environments are created

// =============================================================================
// Vercel Environment Variables for LaunchDarkly
// =============================================================================

// The LaunchDarkly client-side ID is environment-specific.
// Vercel target mapping:
// - production -> prod env
// - preview -> preview env (fallback to dev)
// - development -> dev env
const ldClientSideIdDefault = config.getSecret("launchDarklyClientSideId");

const ldAccessToken = new pulumi.Config("launchdarkly").getSecret("accessToken");
const ldProjectKey = config.get("launchDarklyProjectKey") ?? "tally";

function ensureLdEnvClientSideId(envKey: string, envName: string, color: string) {
  if (!ldAccessToken) return undefined;

  return new command.local.Command(`ld-client-side-id-${envKey}-${stack}`, {
    create: pulumi.interpolate`set -euo pipefail
TOKEN=${ldAccessToken}

# Ensure project exists
curl -sf --retry 5 --retry-all-errors --retry-delay 1 --connect-timeout 10 --max-time 30 "https://app.launchdarkly.com/api/v2/projects/${ldProjectKey}" -H "Authorization: $TOKEN" >/dev/null || \
  curl -sf --retry 5 --retry-all-errors --retry-delay 1 --connect-timeout 10 --max-time 30 -X POST "https://app.launchdarkly.com/api/v2/projects" \
    -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
    -d '{"key":"${ldProjectKey}","name":"Tally"}' >/dev/null

# Ensure environment exists
curl -sf --retry 5 --retry-all-errors --retry-delay 1 --connect-timeout 10 --max-time 30 "https://app.launchdarkly.com/api/v2/projects/${ldProjectKey}/environments/${envKey}" -H "Authorization: $TOKEN" >/dev/null || \
  curl -sf --retry 5 --retry-all-errors --retry-delay 1 --connect-timeout 10 --max-time 30 -X POST "https://app.launchdarkly.com/api/v2/projects/${ldProjectKey}/environments" \
    -H "Authorization: $TOKEN" -H "Content-Type: application/json" \
    -d '{"key":"${envKey}","name":"${envName}","color":"${color}"}' >/dev/null

curl -sf --retry 5 --retry-all-errors --retry-delay 1 --connect-timeout 10 --max-time 30 "https://app.launchdarkly.com/api/v2/projects/${ldProjectKey}/environments/${envKey}" -H "Authorization: $TOKEN" | jq -r '.apiKey'`,
    environment: {},
  }).stdout;
}

const ldClientSideIdDev =
  config.getSecret("launchDarklyClientSideIdDev") ??
  ensureLdEnvClientSideId("dev", "Development", "7B68EE") ??
  ldClientSideIdDefault;

// Only the prod stack needs preview/prod LaunchDarkly environments.
const ldClientSideIdPreview: pulumi.Output<string> | undefined = isProd
  ? config.getSecret("launchDarklyClientSideIdPreview") ?? ldClientSideIdDev ?? ldClientSideIdDefault
  : undefined;

const ldClientSideIdProd: pulumi.Output<string> | undefined = isProd
  ? config.getSecret("launchDarklyClientSideIdProd") ??
    ensureLdEnvClientSideId("prod", "Production", "32CD32") ??
    ldClientSideIdDefault
  : undefined;

const vercelApiToken = new pulumi.Config("vercel").getSecret("apiToken");

function upsertVercelEnvVar(
  name: string,
  key: string,
  value: pulumi.Input<string>,
  target: "production" | "preview" | "development"
) {
  if (!vercelApiToken) return undefined;

  return new command.local.Command(`vercel-env-${name}-${stack}`, {
    create: pulumi.interpolate`set -euo pipefail
TOKEN=${vercelApiToken}
TEAM=${vercelTeamId}
PROJ=${vercelProjectId}
KEY="${key}"
TARGET="${target}"
CURL='curl -sf --retry 5 --retry-all-errors --retry-delay 1 --connect-timeout 10 --max-time 30'

EXISTING_ID=$($CURL "https://api.vercel.com/v9/projects/$PROJ/env?teamId=$TEAM" \
  -H "Authorization: Bearer $TOKEN" | jq -r --arg key "$KEY" --arg target "$TARGET" \
  '.envs[]? | select(.key==$key and (.target|length==1) and .target[0]==$target and (.gitBranch==null)) | .id' | head -n 1)

if [ -n "$EXISTING_ID" ] && [ "$EXISTING_ID" != "null" ]; then
  $CURL -X PATCH "https://api.vercel.com/v9/projects/$PROJ/env/$EXISTING_ID?teamId=$TEAM" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(jq -cn --arg value "$VALUE" '{value:$value}')" >/dev/null
  echo "$EXISTING_ID"
else
  $CURL -X POST "https://api.vercel.com/v9/projects/$PROJ/env?teamId=$TEAM" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(jq -cn --arg key "$KEY" --arg value "$VALUE" --arg target "$TARGET" '{key:$key,value:$value,type:\"encrypted\",target:[$target]}')" \
    | jq -r '.id'
fi`,
    delete: pulumi.interpolate`set -euo pipefail
TOKEN=${vercelApiToken}
TEAM=${vercelTeamId}
PROJ=${vercelProjectId}
KEY="${key}"
TARGET="${target}"
CURL='curl -sf --retry 5 --retry-all-errors --retry-delay 1 --connect-timeout 10 --max-time 30'

EXISTING_ID=$($CURL "https://api.vercel.com/v9/projects/$PROJ/env?teamId=$TEAM" \
  -H "Authorization: Bearer $TOKEN" | jq -r --arg key "$KEY" --arg target "$TARGET" \
  '.envs[]? | select(.key==$key and (.target|length==1) and .target[0]==$target and (.gitBranch==null)) | .id' | head -n 1)

[ -n "$EXISTING_ID" ] && [ "$EXISTING_ID" != "null" ] && \
  $CURL -X DELETE "https://api.vercel.com/v9/projects/$PROJ/env/$EXISTING_ID?teamId=$TEAM" \
    -H "Authorization: Bearer $TOKEN" >/dev/null || true`,
    environment: {
      VALUE: value,
    },
  });
}

if (ldClientSideIdProd) {
  upsertVercelEnvVar(
    "ld-client-side-id-prod",
    "NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID",
    ldClientSideIdProd,
    "production"
  );
}

if (ldClientSideIdPreview) {
  upsertVercelEnvVar(
    "ld-client-side-id-preview",
    "NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID",
    ldClientSideIdPreview,
    "preview"
  );
}

if (ldClientSideIdDev) {
  upsertVercelEnvVar(
    `ld-client-side-id-dev${isProd ? "" : "-stack"}`,
    "NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID",
    ldClientSideIdDev,
    "development"
  );
}

// =============================================================================
// Vercel Environment Variables for PostHog
// =============================================================================

const posthogKeyDefault = config.getSecret("posthogKey");

// Optionally auto-provision PostHog projects and read their public project API keys.
// Uses (in order): pulumi config `posthog:adminToken`, env var `POSTHOG_ADMIN_TOKEN`, or ../.env (when running locally).
const posthogConfig = new pulumi.Config("posthog");
const posthogAdminToken =
  posthogConfig.getSecret("adminToken") ??
  (process.env.POSTHOG_ADMIN_TOKEN ? pulumi.secret(process.env.POSTHOG_ADMIN_TOKEN) : undefined);
const posthogApiHost = posthogConfig.get("apiHost") ?? "https://eu.posthog.com";
const posthogOrgId = posthogConfig.get("organizationId");

function ensurePosthogProjectApiKey(projectName: string) {
  if (!posthogAdminToken) return undefined;

  return new command.local.Command(`posthog-project-key-${projectName}-${stack}`.replace(/[^a-zA-Z0-9-]/g, "-"), {
    create: pulumi.interpolate`set -euo pipefail

TOKEN="$TOKEN"
BASE="${posthogApiHost}"
ORG_ID="${posthogOrgId ?? ""}"

if [ -z "$TOKEN" ] && [ -f ../.env ]; then
  set -a
  # shellcheck disable=SC1091
  . ../.env
  set +a
  TOKEN="$POSTHOG_ADMIN_TOKEN"
fi

if [ -z "$TOKEN" ]; then
  echo "Missing PostHog admin token" >&2
  exit 1
fi

CURL='curl -sfL --http1.1 --retry 10 --retry-all-errors --retry-delay 2 --connect-timeout 10 --max-time 60'
PROJECT_NAME="${projectName}"

if [ -z "$ORG_ID" ]; then
  ORG_ID=$($CURL "$BASE/api/organizations/" -H "Authorization: Bearer $TOKEN" | jq -r '.results[0].id')
fi

PROJECT_ID=$($CURL "$BASE/api/organizations/$ORG_ID/projects/" -H "Authorization: Bearer $TOKEN" | jq -r --arg name "$PROJECT_NAME" '.results[]? | select(.name==$name) | .id' | head -n 1)

# If the project doesn't exist (or plan doesn't allow creating more), fall back to the first existing project.
if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
  PROJECT_ID=$($CURL "$BASE/api/organizations/$ORG_ID/projects/" -H "Authorization: Bearer $TOKEN" | jq -r '.results[0].id')
fi

if [ -z "$PROJECT_ID" ] || [ "$PROJECT_ID" = "null" ]; then
  echo "No PostHog projects found" >&2
  exit 1
fi

$CURL "$BASE/api/projects/$PROJECT_ID/" -H "Authorization: Bearer $TOKEN" | jq -r '.api_token'`,
    environment: {
      TOKEN: posthogAdminToken,
    },
  }).stdout;
}

const posthogKeyDev =
  config.getSecret("posthogKeyDev") ??
  ensurePosthogProjectApiKey("Tally (Dev)") ??
  posthogKeyDefault;

const posthogKeyPreview = isProd
  ? config.getSecret("posthogKeyPreview") ??
    ensurePosthogProjectApiKey("Tally (Preview)") ??
    posthogKeyDev ??
    posthogKeyDefault
  : undefined;

const posthogKeyProd = isProd
  ? config.getSecret("posthogKeyProd") ?? ensurePosthogProjectApiKey("Tally (Prod)") ?? posthogKeyDefault
  : undefined;

const posthogHost = config.get("posthogHost") ?? "https://eu.i.posthog.com";

const anyPosthogKey = posthogKeyProd ?? posthogKeyPreview ?? posthogKeyDev;

if (posthogKeyProd) {
  upsertVercelEnvVar("posthog-key-prod", "NEXT_PUBLIC_POSTHOG_KEY", posthogKeyProd, "production");
}

if (posthogKeyPreview) {
  upsertVercelEnvVar("posthog-key-preview", "NEXT_PUBLIC_POSTHOG_KEY", posthogKeyPreview, "preview");
}

if (posthogKeyDev) {
  upsertVercelEnvVar(
    `posthog-key-dev${isProd ? "" : "-stack"}`,
    "NEXT_PUBLIC_POSTHOG_KEY",
    posthogKeyDev,
    "development"
  );
}

if (anyPosthogKey) {
  if (isProd) {
    upsertVercelEnvVar("posthog-host-prod", "NEXT_PUBLIC_POSTHOG_HOST", posthogHost, "production");
    upsertVercelEnvVar("posthog-host-preview", "NEXT_PUBLIC_POSTHOG_HOST", posthogHost, "preview");
  }

  upsertVercelEnvVar(
    `posthog-host-dev${isProd ? "" : "-stack"}`,
    "NEXT_PUBLIC_POSTHOG_HOST",
    posthogHost,
    "development"
  );
}

// =============================================================================
// Sentry Configuration (IaC-first provisioning) - Prod stack only
// =============================================================================

// Sentry projects to provision
const sentryProjects = [
  { slug: "javascript-nextjs", platform: "javascript-nextjs", name: "Web (Next.js)" },
  { slug: "convex-backend", platform: "node", name: "Backend (Convex)" },
  { slug: "ios", platform: "apple-ios", name: "iOS" },
  { slug: "android", platform: "android", name: "Android" },
];

// Provision Sentry projects and extract DSNs
const sentryProjectResources: { [key: string]: command.local.Command } = {};
const sentryDsns: { [key: string]: pulumi.Output<string> } = {};
const sentryTeam = "tally"; // Team slug within the org

// Only manage Sentry resources from prod stack to avoid conflicts
if (isProd && sentryAdminToken) {
  for (const project of sentryProjects) {
    // Create or get project (idempotent)
    const projectResource = new command.local.Command(`sentry-project-${project.slug}`, {
      create: pulumi.interpolate`
        EXISTING=$(curl -s "https://sentry.io/api/0/projects/${sentryOrg}/${project.slug}/" \
          -H "Authorization: Bearer ${sentryAdminToken}" | jq -r '.slug // empty')
        if [ -n "$EXISTING" ]; then
          echo "$EXISTING"
        else
          curl -s -X POST "https://sentry.io/api/0/teams/${sentryOrg}/${sentryTeam}/projects/" \
            -H "Authorization: Bearer ${sentryAdminToken}" \
            -H "Content-Type: application/json" \
            -d '{"name": "${project.name}", "slug": "${project.slug}", "platform": "${project.platform}"}' | jq -r '.slug'
        fi
      `,
      environment: {},
    });
    sentryProjectResources[project.slug] = projectResource;

    // Extract DSN for the project
    const dsnResource = new command.local.Command(`sentry-dsn-${project.slug}`, {
      create: pulumi.interpolate`
        curl -s "https://sentry.io/api/0/projects/${sentryOrg}/${project.slug}/keys/" \
          -H "Authorization: Bearer ${sentryAdminToken}" | jq -r '.[0].dsn.public // empty'
      `,
      environment: {},
    }, { dependsOn: [projectResource] });

    sentryDsns[project.slug] = dsnResource.stdout;
  }

  // Create Sentry auth token for source map uploads (scoped to project)
  const sentryAuthToken = new command.local.Command("sentry-auth-token", {
    create: pulumi.interpolate`
      # List existing tokens to see if we already have one
      EXISTING=$(curl -s "https://sentry.io/api/0/api-tokens/" \
        -H "Authorization: Bearer ${sentryAdminToken}" | jq -r '.[] | select(.name=="tally-ci-uploads") | .token // empty' | head -n 1)
      if [ -n "$EXISTING" ]; then
        echo "$EXISTING"
      else
        curl -s -X POST "https://sentry.io/api/0/api-tokens/" \
          -H "Authorization: Bearer ${sentryAdminToken}" \
          -H "Content-Type: application/json" \
          -d '{"name": "tally-ci-uploads", "scopes": ["project:releases", "project:write", "org:read"]}' | jq -r '.token // empty'
      fi
    `,
    environment: {},
  });

  // Set Vercel environment variables for Sentry (Next.js)
  const webDsn = sentryDsns["javascript-nextjs"];
  if (webDsn) {
    new vercel.ProjectEnvironmentVariable(
      "sentry-dsn",
      {
        projectId: vercelProjectId,
        teamId: vercelTeamId,
        key: "NEXT_PUBLIC_SENTRY_DSN",
        value: webDsn,
        targets: ["production", "preview", "development"],
      },
      {
        deleteBeforeReplace: true,
        dependsOn: [sentryProjectResources["javascript-nextjs"]],
      }
    );

    new vercel.ProjectEnvironmentVariable(
      "sentry-dsn-server",
      {
        projectId: vercelProjectId,
        teamId: vercelTeamId,
        key: "SENTRY_DSN",
        value: webDsn,
        targets: ["production", "preview", "development"],
      },
      {
        deleteBeforeReplace: true,
        dependsOn: [sentryProjectResources["javascript-nextjs"]],
      }
    );
  }

  new vercel.ProjectEnvironmentVariable(
    "sentry-org",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "SENTRY_ORG",
      value: sentryOrg,
      targets: ["production", "preview", "development"],
    },
    {
      deleteBeforeReplace: true,
    }
  );

  new vercel.ProjectEnvironmentVariable(
    "sentry-project",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "SENTRY_PROJECT",
      value: "javascript-nextjs",
      targets: ["production", "preview", "development"],
    },
    {
      deleteBeforeReplace: true,
    }
  );

  new vercel.ProjectEnvironmentVariable(
    "sentry-auth-token",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "SENTRY_AUTH_TOKEN",
      value: sentryAuthToken.stdout,
      targets: ["production", "preview", "development"],
    },
    {
      deleteBeforeReplace: true,
      dependsOn: [sentryAuthToken],
    }
  );

  // Set SENTRY_ENVIRONMENT per Vercel target
  new vercel.ProjectEnvironmentVariable(
    "sentry-env-prod",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "SENTRY_ENVIRONMENT",
      value: "production",
      targets: ["production"],
    },
    {
      deleteBeforeReplace: true,
    }
  );

  new vercel.ProjectEnvironmentVariable(
    "sentry-env-preview",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "SENTRY_ENVIRONMENT",
      value: "preview",
      targets: ["preview"],
    },
    {
      deleteBeforeReplace: true,
    }
  );

  new vercel.ProjectEnvironmentVariable(
    "sentry-env-dev",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "SENTRY_ENVIRONMENT",
      value: "development",
      targets: ["development"],
    },
    {
      deleteBeforeReplace: true,
    }
  );
}

// =============================================================================
// Grafana Cloud OpenTelemetry (OTel) - Prod stack only
// =============================================================================

const grafanaCloudAdminToken = config.getSecret("grafanaCloudAdminToken");
const grafanaCloudOtlpEndpoint =
  config.get("grafanaCloudOtlpEndpoint") ??
  "https://otlp-gateway-prod-gb-south-1.grafana.net/otlp";
const grafanaCloudInstanceId = config.get("grafanaCloudInstanceId") ?? "1491410";
const grafanaCloudOtlpToken = config.getSecret("grafanaCloudOtlpToken");

// Only manage OTel Vercel env vars from prod stack to avoid conflicts
if (isProd) {
  new vercel.ProjectEnvironmentVariable(
    "otel-service-name",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "OTEL_SERVICE_NAME",
      value: "tally-web",
      targets: ["production", "preview", "development"],
    },
    { deleteBeforeReplace: true }
  );

  new vercel.ProjectEnvironmentVariable(
    "otel-otlp-endpoint",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "OTEL_EXPORTER_OTLP_ENDPOINT",
      value: grafanaCloudOtlpEndpoint,
      targets: ["production", "preview", "development"],
    },
    { deleteBeforeReplace: true }
  );

  new vercel.ProjectEnvironmentVariable(
    "otel-otlp-protocol",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "OTEL_EXPORTER_OTLP_PROTOCOL",
      value: "http/protobuf",
      targets: ["production", "preview", "development"],
    },
    { deleteBeforeReplace: true }
  );

  new vercel.ProjectEnvironmentVariable(
    "otel-traces-sampler",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "OTEL_TRACES_SAMPLER",
      value: "parentbased_traceidratio",
      targets: ["production", "preview", "development"],
    },
    { deleteBeforeReplace: true }
  );

  new vercel.ProjectEnvironmentVariable(
    "otel-resource-prod",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "OTEL_RESOURCE_ATTRIBUTES",
      value: "deployment.environment=production,service.namespace=tally",
      targets: ["production"],
    },
    { deleteBeforeReplace: true }
  );

  new vercel.ProjectEnvironmentVariable(
    "otel-resource-preview",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "OTEL_RESOURCE_ATTRIBUTES",
      value: "deployment.environment=preview,service.namespace=tally",
      targets: ["preview"],
    },
    { deleteBeforeReplace: true }
  );

  new vercel.ProjectEnvironmentVariable(
    "otel-resource-dev",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "OTEL_RESOURCE_ATTRIBUTES",
      value: "deployment.environment=development,service.namespace=tally",
      targets: ["development"],
    },
    { deleteBeforeReplace: true }
  );

  new vercel.ProjectEnvironmentVariable(
    "otel-sampler-arg-prod",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "OTEL_TRACES_SAMPLER_ARG",
      value: "0.1",
      targets: ["production"],
    },
    { deleteBeforeReplace: true }
  );

  new vercel.ProjectEnvironmentVariable(
    "otel-sampler-arg-preview",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "OTEL_TRACES_SAMPLER_ARG",
      value: "0.2",
      targets: ["preview"],
    },
    { deleteBeforeReplace: true }
  );

  new vercel.ProjectEnvironmentVariable(
    "otel-sampler-arg-dev",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "OTEL_TRACES_SAMPLER_ARG",
      value: "1.0",
      targets: ["development"],
    },
    { deleteBeforeReplace: true }
  );

  if (grafanaCloudOtlpToken) {
    const otelHeaders = grafanaCloudOtlpToken.apply((token) => {
      const basic = Buffer.from(`${grafanaCloudInstanceId}:${token}`).toString("base64");
      return `Authorization=Basic ${basic}`;
    });

    new vercel.ProjectEnvironmentVariable(
      "otel-otlp-headers",
      {
        projectId: vercelProjectId,
        teamId: vercelTeamId,
        key: "OTEL_EXPORTER_OTLP_HEADERS",
        value: otelHeaders,
        targets: ["production", "preview", "development"],
      },
      { deleteBeforeReplace: true }
    );
  }
} // End isProd block for OTel

// =============================================================================
// Exports (stack-aware)
// =============================================================================

export const stackName = stack;
export const cloudflareZoneId = zoneId;
export const vercelProjectUrl = `https://${domain}`;
export const vercelProjectIds = {
  teamId: vercelTeamId,
  projectId: vercelProjectId,
};
export const dnsRecords = isProd
  ? {
      root: rootRecord?.name,
      www: wwwRecord?.name,
      vercelTxt: vercelTxtRecord?.name,
    }
  : {
      dev: devRecord?.name,
    };
export const clerkRedirects = clerkRedirectUrls;

// LaunchDarkly exports (temporarily hardcoded while provider is disabled)
export const launchDarklyProject = {
  key: "tally",
  name: "Tally",
};
export const launchDarklyFlags = {
  streaksEnabled: "streaks-enabled",
};

// Sentry exports
export const sentryConfig = {
  org: sentryOrg,
  projects: sentryProjects.map((p) => p.slug),
  dsns: sentryDsns,
};
