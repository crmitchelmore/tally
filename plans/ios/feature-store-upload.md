# Feature: Store upload (pre-release) (iOS)

## Goal
Get the iOS app to a **TestFlight / App Store Connect pre-release** state: all required metadata + assets prepared, a signed build uploaded, and an external beta ready (pending review/approval as applicable).

This feature ends at **"ready to distribute to beta testers"** (and optionally submitted for review), not at a production rollout.

## Non-goals
- Automating the release (Fastlane/CI signing pipelines). That remains the separate "Automation + pipelines" project.
- A production release.

## Prereqs
- App bundle ID, team, signing configuration available.
- Versioning + build number strategy decided.
- Privacy + permissions behavior implemented (tracking, notifications, camera/photos, etc. as relevant).

## Required deliverables
### 1) App Store Connect setup
- Create / confirm App record in App Store Connect.
- Fill out:
  - App name, subtitle, description, keywords
  - Category, age rating
  - Support URL + privacy policy URL
  - Pricing (even if free)
  - Compliance questions (encryption/export)

### 2) Assets
Prepare final-quality assets sized per Apple requirements:
- App icon
- iPhone screenshots (and iPad if supported)
- Optional: App preview video

### 3) Build + upload
- Produce a signed release build (Archive).
- Upload build to App Store Connect.
- Confirm processing completes and build is selectable for TestFlight.

### 4) Pre-release distribution
- Configure TestFlight:
  - Internal testing group(s)
  - External testing group(s) (if needed)
  - Beta app description + "What to test"
- If external testing requires review, submit for TestFlight review.

### 5) Approval gate
- Track review status and resolve any rejection items.
- Once approved, confirm the build can be installed by beta testers.

## Acceptance criteria
- App Store Connect listing exists and is fully populated with required metadata.
- Required screenshots/icon are uploaded and pass validation.
- A signed build is uploaded and processed in App Store Connect.
- A beta testing path exists (internal or external) and is ready to distribute pending approval.
- A short release note / tester instructions exists ("What to test").
