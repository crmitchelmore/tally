import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import * as vercel from "@pulumiverse/vercel";

// Configuration
const config = new pulumi.Config();
const domain = "tally-tracker.app";
const zoneId = "816559836db3c2e80112bd6aeefd6d27";
const vercelProjectId = "prj_xi1aOfL23eFPkcE4XCxCPp6CRkAF";
const vercelTeamId = "team_ifle7fkp7usKufCL8MUCY1As";

// Existing resource IDs (for import)
const existingResources = {
  rootDnsRecord: "cfc8b47f1cbf762c0ff9de2ead2d33d1",
  wwwDnsRecord: "d2841a5ffbf256bc47d0bd6889ffd731",
  vercelTxtRecord: "2117a6cff0c8b0a70e2e8ebe0f81d04e",
};

// =============================================================================
// Cloudflare DNS Records
// =============================================================================

// Root domain -> Vercel (A record, Cloudflare's CNAME flattening at apex)
const rootRecord = new cloudflare.DnsRecord("root-record", {
  zoneId: zoneId,
  name: "@",
  type: "A",
  content: "76.76.21.21", // Vercel's IP
  proxied: false,
  ttl: 1,
}, { 
  import: `${zoneId}/${existingResources.rootDnsRecord}`,
  ignoreChanges: ["content"], // Don't change existing A record
});

// WWW subdomain -> Vercel
const wwwRecord = new cloudflare.DnsRecord("www-record", {
  zoneId: zoneId,
  name: "www",
  type: "CNAME",
  content: "cname.vercel-dns.com",
  proxied: false,
  ttl: 1,
}, { 
  import: `${zoneId}/${existingResources.wwwDnsRecord}`,
});

// Vercel domain verification TXT record
const vercelTxtRecord = new cloudflare.DnsRecord("vercel-txt-record", {
  zoneId: zoneId,
  name: "_vercel",
  type: "TXT",
  content: "vc-domain-verify=tally-tracker.app,90cf862f53bce1742529,dc",
  ttl: 1,
}, {
  import: `${zoneId}/${existingResources.vercelTxtRecord}`,
});

// =============================================================================
// Vercel Domain Configuration (already exists - just reference)
// =============================================================================

// Root domain
const vercelDomain = new vercel.ProjectDomain("tally-domain", {
  projectId: vercelProjectId,
  teamId: vercelTeamId,
  domain: domain,
}, {
  import: `${vercelTeamId}/${vercelProjectId}/${domain}`,
});

// WWW subdomain with redirect
const vercelWwwDomain = new vercel.ProjectDomain("tally-www-domain", {
  projectId: vercelProjectId,
  teamId: vercelTeamId,
  domain: `www.${domain}`,
  redirect: domain,
  redirectStatusCode: 308,
}, {
  import: `${vercelTeamId}/${vercelProjectId}/www.${domain}`,
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
