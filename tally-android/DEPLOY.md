# Android Play Store Deployment Guide

This guide covers setting up automated deployment to Google Play Store using Fastlane and GitHub Actions.

## Prerequisites

1. **Google Play Console account** with the Tally app created
2. **Google Cloud Service Account** with Play Store API access
3. **Release signing keystore** for signing production builds
4. **GitHub repository secrets** configured

---

## One-Time Setup

### 1. Create Google Play Console App

1. Go to [Google Play Console](https://play.google.com/console)
2. Click **Create app**
3. Fill in app details:
   - App name: `Tally`
   - Default language: English
   - App or game: App
   - Free or paid: Free
4. Accept Developer Program Policies
5. Complete the **App content** section (privacy policy, ads, etc.)

### 2. Create Service Account for API Access

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the **Google Play Android Developer API**:
   ```
   APIs & Services → Enable APIs → Search "Google Play Android Developer API" → Enable
   ```
4. Create a Service Account:
   ```
   IAM & Admin → Service Accounts → Create Service Account
   ```
   - Name: `play-store-deploy`
   - Role: (skip for now)
5. Create a JSON key:
   - Click on the service account → Keys → Add Key → Create new key → JSON
   - Save the downloaded JSON file securely

6. Link Service Account to Play Console:
   - Go to [Play Console](https://play.google.com/console) → Settings → API access
   - Click **Link** next to your Google Cloud project
   - Under Service Accounts, find your service account and click **Grant access**
   - Permissions needed:
     - ✅ Release apps to testing tracks
     - ✅ Release to production
     - ✅ Manage production and testing track configuration

### 3. Generate Release Signing Keystore

```bash
# Generate a new keystore (run once, store securely!)
# Note: Do NOT pass passwords on the command line; keytool will prompt you securely.
keytool -genkey -v \
  -keystore release.keystore \
  -alias tally \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -dname "CN=Tally, OU=Mobile, O=Tally, L=London, ST=London, C=GB"

# Convert to base64 for GitHub secret
# Add -w 0 on Linux or -b 0 on macOS to disable line wrapping
base64 -i release.keystore -o release.keystore.base64
cat release.keystore.base64
```

> ⚠️ **IMPORTANT**: Store the keystore and passwords securely! If lost, you cannot update the app on Play Store.

### 4. Configure GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions → New repository secret

Add these secrets:

| Secret Name | Description | Where to get it |
|-------------|-------------|-----------------|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded keystore | `cat release.keystore.base64` |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password | From keytool command |
| `ANDROID_KEY_ALIAS` | Key alias | `tally` (or your alias) |
| `ANDROID_KEY_PASSWORD` | Key password | From keytool command |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Full JSON content | Contents of service account JSON file |

Also ensure these existing secrets are set:
- `SENTRY_AUTH_TOKEN`
- `SENTRY_DSN_ANDROID`
- `CLERK_PUBLISHABLE_KEY`
- `LAUNCHDARKLY_MOBILE_KEY` (optional)
- `POSTHOG_API_KEY` (optional)

### 5. Upload First Build Manually

Google Play requires the first AAB to be uploaded manually:

```bash
cd tally-android

# Install Fastlane dependencies
bundle install

# Configure signing credentials securely via environment variables
# (avoid passing passwords via -P flags on the command line as they
# appear in shell history and process listings)
export KEYSTORE_FILE=path/to/release.keystore
export KEYSTORE_PASSWORD=your_store_password
export KEY_ALIAS=tally
export KEY_PASSWORD=your_key_password

./gradlew bundleRelease
```

Then upload `app/build/outputs/bundle/release/app-release.aab` to Play Console:
- Go to Release → Testing → Internal testing → Create new release
- Upload the AAB
- Complete release notes
- Submit for review

---

## Automated Deployment

### Deploy to Internal Testing (automatic)

Pushes to `main` that modify files under `tally-android/` automatically deploy to the **internal** testing track. Tagged releases (v*) also trigger deployments independently.

### Manual Deployment

Trigger from GitHub Actions → Android (deploy) → Run workflow:

| Track | Use Case |
|-------|----------|
| `internal` | Team testing (up to 100 testers) |
| `alpha` | Closed testing (invite-only) |
| `beta` | Open testing (anyone can join) |
| `production` | Public release |

### Promotion Flow

The recommended release flow:

```
internal → alpha → beta → production
```

To promote, run the workflow with:
- **track**: Target track (e.g., `alpha`)
- **promote_from**: Source track (e.g., `internal`)

---

## Local Development

### Install Fastlane

```bash
cd tally-android

# Install Ruby dependencies
bundle install

# Verify installation
bundle exec fastlane --version
```

### Available Lanes

```bash
# Run tests
bundle exec fastlane test

# Build debug APK
bundle exec fastlane build_debug

# Build release AAB (requires signing env vars)
bundle exec fastlane build_release

# Deploy to internal track
bundle exec fastlane internal

# Promote internal → alpha
bundle exec fastlane alpha

# Promote alpha → beta
bundle exec fastlane beta

# Promote beta → production
bundle exec fastlane production

# Bump version code
bundle exec fastlane bump_version
bundle exec fastlane bump_version version_name:1.2.0
```

### Environment Variables for Local Deploy

```bash
export KEYSTORE_FILE=path/to/release.keystore
export KEYSTORE_PASSWORD=your_store_password
export KEY_ALIAS=tally
export KEY_PASSWORD=your_key_password
export GOOGLE_PLAY_JSON_KEY_FILE=path/to/service-account.json
```

---

## Version Management

### Version Code

The `versionCode` must be incremented for every release. Use:

```bash
bundle exec fastlane bump_version
```

Or manually edit `app/build.gradle.kts`:

```kotlin
defaultConfig {
    versionCode = 2  // Increment this
    versionName = "0.2.0"
}
```

### Version Name

Follow semantic versioning: `MAJOR.MINOR.PATCH`

```bash
bundle exec fastlane bump_version version_name:1.0.0
```

---

## Troubleshooting

### "APK not signed" error

Ensure all signing environment variables are set:
```bash
echo $KEYSTORE_FILE $KEYSTORE_PASSWORD $KEY_ALIAS $KEY_PASSWORD
```

### "Google Play API" error

1. Verify service account has correct permissions in Play Console
2. Check the JSON key file is valid
3. Ensure the app exists in Play Console

### "Version code already used" error

Bump the version code:
```bash
bundle exec fastlane bump_version
```

### First-time setup fails

The first AAB must be uploaded manually via Play Console. After that, Fastlane can manage releases.

---

## Play Store Listing Checklist

Complete these in Play Console before first public release:

- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG)
- [ ] Screenshots (phone + tablet)
- [ ] Short description (80 chars)
- [ ] Full description (4000 chars)
- [ ] App category
- [ ] Content rating questionnaire
- [ ] Privacy policy URL
- [ ] Target audience and content
- [ ] News apps declaration
- [ ] COVID-19 contact tracing declaration
- [ ] Data safety form

---

## Security Notes

1. **Never commit** keystore files or service account JSON to git
2. **Rotate** service account keys periodically
3. **Use GitHub Environments** for production deployments (requires approval)
4. **Backup** your keystore file securely - losing it means losing ability to update the app

---

## Related Documentation

- [Fastlane Android Setup](https://docs.fastlane.tools/getting-started/android/setup/)
- [Google Play Developer API](https://developers.google.com/android-publisher)
- [App Signing by Google Play](https://developer.android.com/studio/publish/app-signing)
