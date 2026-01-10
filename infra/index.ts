import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import * as vercel from "@pulumiverse/vercel";
import * as command from "@pulumi/command";
import * as launchdarkly from "@lbrlabs/pulumi-launchdarkly";

// Configuration
const config = new pulumi.Config();
const domain = "tally-tracker.app";
const zoneId = "816559836db3c2e80112bd6aeefd6d27";
const vercelProjectId = "prj_tXdIJDmRB1qKZyo5Ngat62XoaMgw";
const vercelTeamId = "team_ifle7fkp7usKufCL8MUCY1As";

// Sentry configuration
const sentryOrg = "tally-lz";
const sentryAdminToken = config.getSecret("sentryAdminToken");

// Manage the existing Vercel project.
// NOTE: the `import` option is one-time only; keeping it can cause Pulumi to re-import/delete.
const vercelProject = new vercel.Project("tally-web-project", {
  teamId: vercelTeamId,
  name: "tally-web",
  framework: "nextjs",
  rootDirectory: "tally-web",
  autoAssignCustomDomains: true,
});

// Clerk configuration
const clerkSecretKey = config.requireSecret("clerkSecretKey");
const clerkPublishableKey = config.getSecret("clerkPublishableKey");

// Convex configuration
const convexDeployment = config.get("convexDeployment");

// Ensure production deployments use the Clerk instance/keys managed by Pulumi config.
// `clerkPublishableKey` is optional to avoid breaking existing stacks until it's set.
if (clerkPublishableKey) {
  new vercel.ProjectEnvironmentVariable(
    "clerk-publishable-key",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
      value: clerkPublishableKey,
      targets: ["production"],
    },
    {
      deleteBeforeReplace: true,
    }
  );
} else {
  pulumi.log.warn(
    "Pulumi config 'clerkPublishableKey' is not set; leaving NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY unchanged in Vercel."
  );
}

new vercel.ProjectEnvironmentVariable(
  "clerk-secret-key",
  {
    projectId: vercelProjectId,
    teamId: vercelTeamId,
    key: "CLERK_SECRET_KEY",
    value: clerkSecretKey,
    targets: ["production"],
  },
  {
    deleteBeforeReplace: true,
  }
);

// Convex deployment env var
if (convexDeployment) {
  new vercel.ProjectEnvironmentVariable(
    "convex-deployment",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "CONVEX_DEPLOYMENT",
      value: convexDeployment,
      targets: ["production"],
    },
    {
      deleteBeforeReplace: true,
    }
  );

  // NEXT_PUBLIC_CONVEX_URL is required for the frontend to connect
  // Format: https://<deployment-slug>.convex.cloud (strip "dev:" prefix)
  const convexUrl = `https://${convexDeployment.replace(/^dev:/, "")}.convex.cloud`;
  new vercel.ProjectEnvironmentVariable(
    "convex-url",
    {
      projectId: vercelProjectId,
      teamId: vercelTeamId,
      key: "NEXT_PUBLIC_CONVEX_URL",
      value: convexUrl,
      targets: ["production"],
    },
    {
      deleteBeforeReplace: true,
    }
  );
} else {
  pulumi.log.warn(
    "Pulumi config 'convexDeployment' is not set; leaving CONVEX_DEPLOYMENT unchanged in Vercel."
  );
}

// =============================================================================
// Cloudflare DNS Records
// =============================================================================

// Root domain -> Vercel (A record for apex domain)
const rootRecord = new cloudflare.DnsRecord("root-record", {
  zoneId: zoneId,
  name: "@",
  type: "A",
  content: "76.76.21.21", // Vercel's IP
  proxied: false,
  ttl: 1,
});

// WWW subdomain -> Vercel
const wwwRecord = new cloudflare.DnsRecord("www-record", {
  zoneId: zoneId,
  name: "www",
  type: "CNAME",
  content: "cname.vercel-dns.com",
  proxied: false,
  ttl: 1,
});

// Vercel domain verification TXT record
const vercelTxtRecord = new cloudflare.DnsRecord("vercel-txt-record", {
  zoneId: zoneId,
  name: "_vercel",
  type: "TXT",
  content: "vc-domain-verify=tally-tracker.app,90cf862f53bce1742529,dc",
  ttl: 1,
});

// =============================================================================
// Vercel Domain Configuration
// =============================================================================

// Root domain
const vercelDomain = new vercel.ProjectDomain("tally-domain", {
  projectId: vercelProjectId,
  teamId: vercelTeamId,
  domain: domain,
});

// WWW subdomain with redirect
const vercelWwwDomain = new vercel.ProjectDomain("tally-www-domain", {
  projectId: vercelProjectId,
  teamId: vercelTeamId,
  domain: `www.${domain}`,
  redirect: domain,
  redirectStatusCode: 308,
});

// =============================================================================
// Clerk Redirect URLs
// =============================================================================

// Helper to manage Clerk redirect URLs via API
// Include `/app` so Clerk can redirect users to the app after authentication.
// Include SSO callback routes used by Clerk for OAuth flows.
const clerkRedirectUrls = [
  `https://${domain}`,
  `https://${domain}/app`,
  `https://${domain}/sign-in/sso-callback`,
  `https://${domain}/sign-up/sso-callback`,
  `https://www.${domain}`,
  `https://www.${domain}/app`,
  `https://www.${domain}/sign-in/sso-callback`,
  `https://www.${domain}/sign-up/sso-callback`,
];

// Create Clerk redirect URLs using the API
const clerkRedirectUrlResources = clerkRedirectUrls.map((url, index) => {
  return new command.local.Command(`clerk-redirect-url-${index}`, {
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

// LaunchDarkly project with dev/preview/prod environments
const ldProject = new launchdarkly.Project("tally-ld-project", {
  key: "tally",
  name: "Tally",
  tags: ["pulumi"],
  environments: [
    {
      key: "dev",
      name: "Development",
      color: "7B68EE", // purple
      tags: ["pulumi"],
    },
    {
      key: "preview",
      name: "Preview",
      color: "FFA500", // orange
      tags: ["pulumi"],
    },
    {
      key: "prod",
      name: "Production",
      color: "32CD32", // green
      tags: ["pulumi"],
    },
  ],
  defaultClientSideAvailabilities: [
    {
      usingEnvironmentId: true,
      usingMobileKey: true,
    },
  ],
});

// Test feature flag: streaks-enabled (boolean)
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
  defaults: {
    onVariation: 1, // true
    offVariation: 0, // false
  },
  tags: ["pulumi", "rollout"],
  clientSideAvailabilities: [
    {
      usingEnvironmentId: true,
      usingMobileKey: true,
    },
  ],
});

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
// Sentry Configuration (IaC-first provisioning)
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

if (sentryAdminToken) {
  for (const project of sentryProjects) {
    // Create or get project (idempotent)
    const projectResource = new command.local.Command(`sentry-project-${project.slug}`, {
      create: pulumi.interpolate`
        EXISTING=$(curl -s "https://sentry.io/api/0/projects/${sentryOrg}/${project.slug}/" \
          -H "Authorization: Bearer ${sentryAdminToken}" | jq -r '.slug // empty')
        if [ -n "$EXISTING" ]; then
          echo "$EXISTING"
        else
          curl -s -X POST "https://sentry.io/api/0/teams/${sentryOrg}/${sentryOrg}/projects/" \
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
} else {
  pulumi.log.warn(
    "Pulumi config 'sentryAdminToken' is not set; Sentry resources will not be provisioned."
  );
}

// =============================================================================
// Exports
// =============================================================================

export const cloudflareZoneId = zoneId;
export const vercelProjectUrl = `https://${domain}`;
export const vercelProjectIds = {
  teamId: vercelTeamId,
  projectId: vercelProjectId,
};
export const dnsRecords = {
  root: rootRecord.name,
  www: wwwRecord.name,
  vercelTxt: vercelTxtRecord.name,
};
export const clerkRedirects = clerkRedirectUrls;

// LaunchDarkly exports
export const launchDarklyProject = {
  key: ldProject.key,
  name: ldProject.name,
};
export const launchDarklyFlags = {
  streaksEnabled: streaksEnabledFlag.key,
};

// Sentry exports
export const sentryConfig = {
  org: sentryOrg,
  projects: sentryProjects.map((p) => p.slug),
  dsns: sentryDsns,
};
