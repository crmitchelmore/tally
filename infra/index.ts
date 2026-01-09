import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import * as vercel from "@pulumiverse/vercel";
import * as command from "@pulumi/command";

// Configuration
const config = new pulumi.Config();
const domain = "tally-tracker.app";
const zoneId = "816559836db3c2e80112bd6aeefd6d27";
const vercelProjectId = "prj_xi1aOfL23eFPkcE4XCxCPp6CRkAF";
const vercelTeamId = "team_ifle7fkp7usKufCL8MUCY1As";

// Clerk configuration
const clerkSecretKey = config.requireSecret("clerkSecretKey");

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
const clerkRedirectUrls = [
  `https://${domain}`,
  `https://www.${domain}`,
];

// Create Clerk redirect URLs using the API
const clerkRedirectUrlResources = clerkRedirectUrls.map((url, index) => {
  return new command.local.Command(`clerk-redirect-url-${index}`, {
    create: pulumi.interpolate`curl -s -X POST "https://api.clerk.com/v1/redirect_urls" \
      -H "Authorization: Bearer ${clerkSecretKey}" \
      -H "Content-Type: application/json" \
      -d '{"url": "${url}"}' | jq -r '.id // empty'`,
    delete: pulumi.interpolate`ID=$(curl -s "https://api.clerk.com/v1/redirect_urls" \
      -H "Authorization: Bearer ${clerkSecretKey}" | jq -r '.[] | select(.url=="${url}") | .id') && \
      [ -n "$ID" ] && curl -s -X DELETE "https://api.clerk.com/v1/redirect_urls/$ID" \
      -H "Authorization: Bearer ${clerkSecretKey}" || true`,
    environment: {},
  });
});

// =============================================================================
// Exports
// =============================================================================

export const cloudflareZoneId = zoneId;
export const vercelProjectUrl = `https://${domain}`;
export const dnsRecords = {
  root: rootRecord.name,
  www: wwwRecord.name,
  vercelTxt: vercelTxtRecord.name,
};
export const clerkRedirects = clerkRedirectUrls;
