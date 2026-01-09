import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import * as vercel from "@pulumiverse/vercel";
import * as command from "@pulumi/command";

// Configuration
const config = new pulumi.Config();
const domain = "tally-tracker.app";
const zoneId = "816559836db3c2e80112bd6aeefd6d27";
const vercelProjectId = "prj_tXdIJDmRB1qKZyo5Ngat62XoaMgw";
const vercelTeamId = "team_ifle7fkp7usKufCL8MUCY1As";

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
