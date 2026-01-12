# Tally Android

Minimal native Android scaffold (Compose) to enable CI and iterative development.

## Build

```bash
cd tally-android
./gradlew :app:assembleDebug
```

## Test

```bash
./gradlew :app:test              # Unit tests
./gradlew :app:connectedAndroidTest  # Instrumented tests (requires emulator/device)
```

## Deploy

See [DEPLOY.md](./DEPLOY.md) for Play Store deployment setup.

Quick reference:
```bash
bundle install
bundle exec fastlane internal    # Deploy to internal testing
```

## API base URL

Convex HTTP routes are served from:

- `https://<deployment>.convex.site`

Example (prod): `https://bright-jackal-396.convex.site`
