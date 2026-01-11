# Security Policy

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, please use one of these methods:

1. **GitHub Security Advisories** (preferred): Use [GitHub's private vulnerability reporting](https://github.com/tally-tracker-org/tally/security/advisories/new)
2. **Email**: Send details to security@tally-tracker.app

### What to Include

Please include as much of the following as possible:

- Type of issue (e.g., XSS, CSRF, authentication bypass, data exposure)
- Full paths of affected source files
- Steps to reproduce the vulnerability
- Proof-of-concept or exploit code (if possible)
- Impact assessment (what an attacker could achieve)

### Response Timeline

- **Initial response**: Within 48 hours
- **Status update**: Within 7 days
- **Fix timeline**: Depends on severity
  - Critical: 24-48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: 90 days

## Supported Versions

| Version | Supported |
| ------- | --------- |
| Latest (main branch) | ✅ |
| Older versions | ❌ |

## Security Measures

This project implements the following security controls:

- **Authentication**: Clerk (OAuth 2.0, session management)
- **Database**: Convex with per-user data isolation
- **Secret scanning**: GitHub push protection enabled
- **Dependency scanning**: Dependabot security updates
- **SAST**: CodeQL analysis on all PRs
- **Secret detection**: Gitleaks in CI

## Scope

The following are in scope for security reports:

- tally-tracker.app web application
- Convex backend functions
- Infrastructure configuration (Pulumi)
- Mobile apps (when released)

The following are **out of scope**:

- Third-party services (Clerk, Convex, Vercel, LaunchDarkly)
- Social engineering attacks
- Physical security
- DoS attacks against production infrastructure

## Recognition

We appreciate security researchers who help keep Tally secure. With your permission, we'll acknowledge your contribution in our security advisories.

## Disclosure Policy

We follow coordinated disclosure:

1. Reporter submits vulnerability privately
2. We acknowledge and investigate
3. We develop and test a fix
4. We release the fix and publish an advisory
5. Reporter may publish details 30 days after fix release
