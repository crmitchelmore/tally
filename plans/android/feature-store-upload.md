# Feature: Store upload (pre-release) (Android)

## Goal
Get the Android app to a **Google Play Console pre-release** state: all required listing metadata + assets prepared, a signed build uploaded, and a closed/internal testing track ready to invite beta testers (pending review/approval as applicable).

This feature ends at **"ready to distribute to beta testers"** (and optionally submitted for review), not at a production rollout.

## Non-goals
- Full release automation/signing pipelines. That remains the separate "Automation + pipelines" project.
- A production rollout.

## Prereqs
- ApplicationId (package name) finalized.
- Keystore + signing configuration available.
- Versioning strategy decided.

## Required deliverables
### 1) Play Console setup
- Create / confirm the app in Play Console.
- Fill out required sections (at minimum):
  - Store listing (title, short/long description)
  - App category
  - Contact details
  - Privacy Policy URL
  - Data safety form
  - Content rating questionnaire

### 2) Assets
Prepare final-quality assets per Google requirements:
- App icon
- Feature graphic
- Phone screenshots (and tablet/TV/Wear if supported)
- Optional: promo video

### 3) Build + upload
- Produce a signed AAB (recommended).
- **Preferred upload tool:** Gradle Play Publisher (`com.github.triplet.play`).
  - Auth: `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (service account with Play Console access).
  - Upload target: **Internal testing** or **Closed testing** track.
- Resolve any Play Console warnings that block testing/review.

### 4) Pre-release distribution
- Configure testing track:
  - Tester groups / email list or Google Groups
  - Release notes
- Generate tester invite link and verify install succeeds on a real device.

### 5) Approval gate
- If Play requires review for the chosen track, submit and track status.
- Resolve any rejection items and re-submit as needed.

## Acceptance criteria
- Play Console listing exists and all required forms are complete.
- Required screenshots/graphics are uploaded and pass validation.
- A signed AAB is uploaded to an internal/closed testing track.
- A beta testing path exists and testers can be invited pending approval.
- A short tester instruction / release note exists.
