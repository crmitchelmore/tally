# iOS TestFlight Release Setup

This guide covers setting up automated TestFlight releases for the Tally iOS app.

## Prerequisites

1. Apple Developer Program membership ($99/year)
2. App created in App Store Connect
3. GitHub repository with Actions enabled

## Setup Steps

### 1. Create App Store Connect API Key

1. Go to [App Store Connect → Users and Access → Integrations → App Store Connect API](https://appstoreconnect.apple.com/access/integrations/api)
2. Click **Generate API Key**
3. Name: `GitHub Actions - Tally`
4. Access: **App Manager** (or Admin for full access)
5. Download the `.p8` key file (you can only download it once!)
6. Note the **Key ID** (e.g., `ABC123DEF4`)
7. Note the **Issuer ID** at the top of the page (e.g., `12345678-1234-1234-1234-123456789012`)

### 2. Create Distribution Certificate

1. Open **Keychain Access** on your Mac
2. Go to **Keychain Access → Certificate Assistant → Request a Certificate From a Certificate Authority**
3. Enter your email, select "Saved to disk", click Continue
4. Go to [Apple Developer → Certificates](https://developer.apple.com/account/resources/certificates/list)
5. Click **+** → Select **Apple Distribution** → Continue
6. Upload your CSR file → Download the certificate
7. Double-click to install in Keychain
8. In Keychain Access, find "Apple Distribution: [Your Name]"
9. Right-click → **Export** → Save as `.p12` with a strong password

### 3. Create Provisioning Profile

1. Go to [Apple Developer → Profiles](https://developer.apple.com/account/resources/profiles/list)
2. Click **+** → Select **App Store Connect** → Continue
3. Select **com.tally.app** (create App ID first if needed)
4. Select your distribution certificate
5. Name: `Tally App Store`
6. Download the `.mobileprovision` file

### 4. Get Your App ID and Team ID

**Team ID:**
- Go to [Apple Developer → Membership](https://developer.apple.com/account/#!/membership)
- Copy your **Team ID** (e.g., `ABCD1234EF`)

**App ID (App Store Connect):**
1. Go to [App Store Connect → Apps](https://appstoreconnect.apple.com/apps)
2. Select your app
3. Go to **App Information** in the sidebar
4. The **Apple ID** is shown (e.g., `1234567890`)

### 5. Create TestFlight Beta Group

1. In App Store Connect, go to your app
2. Click **TestFlight** tab
3. Under **Internal Testing** or **External Testing**, click **+** to create a group
4. Name it (e.g., `Beta Testers`)
5. After creation, look at the URL - the group ID is the UUID at the end
   - Example: `https://appstoreconnect.apple.com/apps/123/testflight/groups/12345678-1234-1234-1234-123456789012`
   - Group ID: `12345678-1234-1234-1234-123456789012`

### 6. Configure GitHub Secrets

Go to **Settings → Secrets and variables → Actions** in your GitHub repo and add:

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `IOS_TEAM_ID` | Apple Developer Team ID | Step 4 |
| `IOS_APP_ID` | App Store Connect App ID | Step 4 |
| `APP_STORE_CONNECT_KEY_ID` | API Key ID | Step 1 |
| `APP_STORE_CONNECT_ISSUER_ID` | API Issuer ID | Step 1 |
| `APP_STORE_CONNECT_PRIVATE_KEY` | Contents of `.p8` file | Step 1 (copy file contents) |
| `IOS_SIGNING_CERT_P12_BASE64` | Base64-encoded .p12 | See below |
| `IOS_SIGNING_CERT_PASSWORD` | Password for .p12 | Step 2 |
| `IOS_PROVISIONING_PROFILE_BASE64` | Base64-encoded profile | See below |
| `IOS_KEYCHAIN_PASSWORD` | Temp keychain password | Generate any secure password |
| `IOS_TESTFLIGHT_BETA_GROUP_IDS` | Beta group ID(s) | Step 5 (one per line) |

**Base64 encoding commands:**

```bash
# Encode certificate
base64 -i /path/to/certificate.p12 | pbcopy
# Paste into IOS_SIGNING_CERT_P12_BASE64

# Encode provisioning profile
base64 -i /path/to/profile.mobileprovision | pbcopy
# Paste into IOS_PROVISIONING_PROFILE_BASE64

# Copy .p8 key contents
cat /path/to/AuthKey_XXXXXX.p8 | pbcopy
# Paste into APP_STORE_CONNECT_PRIVATE_KEY
```

## Usage

### Trigger a Release

1. Go to **Actions** → **iOS TestFlight Release**
2. Click **Run workflow**
3. Fill in:
   - **Version number**: `1.0.0` (follows semver)
   - **Build number**: Leave empty for auto-generated, or specify manually
   - **Release notes**: What's new in this build
4. Click **Run workflow**

### What Happens

1. **Build & Upload** (~15-30 min)
   - Checks out code
   - Installs signing certificates
   - Generates Xcode project with Tuist
   - Archives the app
   - Exports signed IPA
   - Uploads to App Store Connect

2. **Poll & Distribute** (~5-60 min)
   - Waits for App Store Connect processing
   - Submits for beta app review (if external testers)
   - Adds build to TestFlight beta groups
   - Notifies testers
   - Creates GitHub release

### Build Numbers

- If left empty, auto-generates as `YYMMDD` + run number (e.g., `25012523`)
- Guarantees uniqueness per day
- Can be manually specified for specific versions

## Troubleshooting

### "No valid signing identity found"
- Check certificate is not expired
- Verify base64 encoding is complete (no truncation)
- Ensure password is correct

### "Provisioning profile doesn't match bundle ID"
- Profile must be for `com.tally.app`
- Must be App Store Connect distribution type
- Must include the signing certificate

### "Build processing failed"
- Check for issues in App Store Connect
- Look for email from Apple about rejections
- Verify app meets minimum requirements

### "API authentication failed"
- Verify API key has correct permissions
- Check key hasn't been revoked
- Ensure private key is complete (including `-----BEGIN/END-----` lines)

## Security Notes

- Never commit secrets to the repository
- Rotate API keys periodically
- Use organization secrets for shared access
- Certificate/profile expire annually - set reminders
