# iOS TestFlight - Missing Secrets

You already have most secrets configured. Here's what's still needed:

## 1. Get IOS_APP_ID (App Store Connect App ID)

1. Go to [App Store Connect → Apps](https://appstoreconnect.apple.com/apps)
2. Select **Tally**
3. Go to **App Information** in the sidebar
4. Copy the **Apple ID** (numeric, e.g., `1234567890`)

## 2. Create TestFlight Beta Group & Get ID

1. In App Store Connect, go to your app → **TestFlight** tab
2. Under **Internal Testing** or **External Testing**, click **+** to create a group
3. Name it (e.g., `Beta Testers`)
4. After creation, look at the URL - the group ID is the UUID at the end:
   - Example: `.../testflight/groups/12345678-1234-1234-1234-123456789012`
   - Group ID: `12345678-1234-1234-1234-123456789012`

## 3. Convert Existing Files to GitHub Secrets Format

You have file paths in .env. Convert them for GitHub Actions:

```bash
# Load your .env first
source .env

# Convert .p8 key file to contents (for APP_STORE_CONNECT_PRIVATE_KEY)
cat "$APP_STORE_CONNECT_PRIVATE_KEY_PATH"
# Copy entire output including -----BEGIN/END PRIVATE KEY----- lines

# Convert P12 to base64 (for IOS_SIGNING_CERT_P12_BASE64)
base64 -i "$IOS_SIGNING_CERT_P12_PATH" | pbcopy
# Paste into GitHub secret

# Convert provisioning profile to base64 (for IOS_PROVISIONING_PROFILE_BASE64)
base64 -i "$IOS_PROVISIONING_PROFILE_PATH" | pbcopy
# Paste into GitHub secret
```

## 4. Add Secrets to GitHub

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Source |
|--------|--------|
| `IOS_APP_ID` | Step 1 above |
| `IOS_TESTFLIGHT_BETA_GROUP_IDS` | Step 2 above |
| `APP_STORE_CONNECT_PRIVATE_KEY` | Contents of .p8 file |
| `IOS_SIGNING_CERT_P12_BASE64` | Base64 of .p12 file |
| `IOS_PROVISIONING_PROFILE_BASE64` | Base64 of .mobileprovision |

**Already in .env (just copy values to GitHub):**
- `IOS_TEAM_ID`
- `APP_STORE_CONNECT_KEY_ID`
- `APP_STORE_CONNECT_ISSUER_ID`
- `IOS_SIGNING_CERT_PASSWORD`
- `IOS_KEYCHAIN_PASSWORD`

## Usage

Once secrets are configured:
1. Go to **Actions** → **iOS TestFlight Release**
2. Click **Run workflow**
3. Enter version (e.g., `1.0.0`) and optional release notes
4. Click **Run workflow**
