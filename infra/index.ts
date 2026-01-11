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

// Legacy/vanity domain: ensure this never accidentally points at a preview deployment.
// We manage it as a redirect to the canonical .app domain.
const legacyDomain = "tally-tracker.com";

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
let vercelLegacyDomain: vercel.ProjectDomain | undefined;
let vercelLegacyWwwDomain: vercel.ProjectDomain | undefined;
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

  // Legacy .com domain: force redirect to canonical .app to avoid accidental preview/dev env vars.
  vercelLegacyDomain = new vercel.ProjectDomain("tally-legacy-domain", {
    projectId: vercelProjectId,
    teamId: vercelTeamId,
    domain: legacyDomain,
    redirect: baseDomain,
    redirectStatusCode: 308,
  });

  vercelLegacyWwwDomain = new vercel.ProjectDomain("tally-legacy-www-domain", {
    projectId: vercelProjectId,
    teamId: vercelTeamId,
    domain: `www.${legacyDomain}`,
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

// We'll use Pulumi outputs from the LD project to set Vercel env vars
// The client-side ID is needed for browser-side SDK initialization
const ldClientSideId = config.getSecret("launchDarklyClientSideId");

if (ldClientSideId) {
  new vercel.ProjectEnvironmentVariable(
    "ld-client-side-id",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "NEXT_PUBLIC_LAUNCHDARKLY_CLIENT_SIDE_ID",
      value: ldClientSideId,
      targets: ["production", "preview", "development"],
    },
    {
      deleteBeforeReplace: true,
    }
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
