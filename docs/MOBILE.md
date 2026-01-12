# Mobile Platform Guide

This document covers platform-specific implementation details for iOS and Android.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Shared Contracts                          │
│              packages/shared-types (TypeScript)              │
│                           ↓                                  │
│    ┌─────────────────────┴─────────────────────┐            │
│    │                                           │            │
│    ▼                                           ▼            │
│ TallyCore (Swift)                    tallycore (Kotlin)     │
│ - Models                             - Models               │
│ - TallyAPI                           - TallyApi             │
│ - FeatureFlags                       - FeatureFlags         │
└─────────────────────────────────────────────────────────────┘
```

## API Contract

Both platforms use the same HTTP API defined in `packages/shared-types`.

### Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://bright-jackal-396.convex.site` |
| Development | `https://bright-jackal-396.convex.site` |

### Authentication

All authenticated endpoints require a Bearer token from Clerk:

```
Authorization: Bearer <clerk-session-token>
```

## iOS Implementation

### Project Structure

```
tally-ios/
├── TallyApp/              # Main app target
├── TallyAppTests/         # Unit tests
├── TallyCore/             # Swift Package
│   └── Sources/TallyCore/
│       ├── API/           # TallyAPI.swift
│       ├── Models/        # Data models
│       └── FeatureFlags/  # LaunchDarkly
└── TallyDesignSystem/     # UI components
```

### Sentry Integration

Add to `TallyApp/TallyApp.swift`:

```swift
import Sentry

@main
struct TallyApp: App {
    init() {
        SentrySDK.start { options in
            options.dsn = "YOUR_SENTRY_DSN"
            options.environment = Configuration.environment
            options.releaseName = Bundle.main.releaseVersionNumber
            options.tracesSampleRate = 0.1
            options.enableAutoSessionTracking = true
            
            // Privacy: don't capture PII
            options.beforeSend = { event in
                event.user?.email = nil
                event.user?.username = nil
                return event
            }
        }
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

extension Bundle {
    var releaseVersionNumber: String {
        "\(infoDictionary?["CFBundleShortVersionString"] as? String ?? "0").\(infoDictionary?["CFBundleVersion"] as? String ?? "0")"
    }
}
```

### Clerk Authentication

```swift
import ClerkSDK

// In your auth manager
class AuthManager: ObservableObject {
    @Published var token: String?
    
    func signIn() async throws {
        // Clerk sign-in flow
        let session = try await Clerk.shared.signIn()
        self.token = try await session.getToken()
    }
    
    func getToken() async throws -> String {
        guard let session = Clerk.shared.session else {
            throw AuthError.notAuthenticated
        }
        return try await session.getToken()
    }
}
```

### Network Layer with Retry

```swift
extension TallyAPI {
    func withRetry<T>(
        maxAttempts: Int = 3,
        operation: () async throws -> T
    ) async throws -> T {
        var lastError: Error?
        
        for attempt in 1...maxAttempts {
            do {
                return try await operation()
            } catch let error as APIError {
                lastError = error
                
                // Don't retry client errors
                if case .httpStatus(let code, _) = error, (400..<500).contains(code) {
                    throw error
                }
                
                // Exponential backoff
                let delay = Double(1 << (attempt - 1))
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
            }
        }
        
        throw lastError ?? APIError.invalidResponse
    }
}
```

## Store deployment (CI)

This repo now includes GitHub Actions workflows for **iOS (TestFlight/App Store)** and **Android (Google Play)**.

Required GitHub Actions secrets (recommended in an environment named `mobile-release`):

### iOS (App Store Connect)

- `IOS_TEAM_ID`
- `IOS_PROFILE_NAME` (the provisioning profile name in Apple Developer)
- `IOS_KEYCHAIN_PASSWORD`
- `IOS_SIGNING_CERT_P12_BASE64` (base64 of an Apple Distribution `.p12`)
- `IOS_SIGNING_CERT_PASSWORD`
- `IOS_PROVISIONING_PROFILE_BASE64` (base64 of the `.mobileprovision`)
- `ASC_KEY_ID`
- `ASC_ISSUER_ID`
- `ASC_KEY_CONTENT_BASE64` (base64 of the `.p8` file)

### Android (Google Play)

- `PLAY_SERVICE_ACCOUNT_JSON_BASE64` (base64 of the service-account JSON)
- `ANDROID_KEYSTORE_BASE64` (base64 of your upload keystore)
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Workflows:
- `.github/workflows/ios.yml` (manual `workflow_dispatch`: `beta` or `release`)
- `.github/workflows/android.yml` (manual `workflow_dispatch`: `internal` or `production`)

## Android Implementation

### Project Structure

```
tally-android/
├── app/                   # Main app module
│   └── src/main/
│       ├── java/app/tally/
│       └── res/
├── tallycore/             # Core library module
│   └── src/main/kotlin/app/tally/core/
│       ├── api/           # TallyApi.kt
│       └── model/         # Data models
└── gradle/
```

### Sentry Integration

Add to `app/build.gradle.kts`:

```kotlin
plugins {
    id("io.sentry.android.gradle") version "4.0.0"
}

sentry {
    org.set("tally-lz")
    projectName.set("android")
    authToken.set(System.getenv("SENTRY_AUTH_TOKEN"))
    includeSourceContext.set(true)
}
```

Initialize in `TallyApplication.kt`:

```kotlin
import io.sentry.android.core.SentryAndroid

class TallyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        
        SentryAndroid.init(this) { options ->
            options.dsn = BuildConfig.SENTRY_DSN
            options.environment = BuildConfig.BUILD_TYPE
            options.release = "${BuildConfig.VERSION_NAME}+${BuildConfig.VERSION_CODE}"
            options.tracesSampleRate = 0.1
            options.isEnableAutoSessionTracking = true
            
            // Privacy: don't capture PII
            options.beforeSend = SentryOptions.BeforeSendCallback { event, _ ->
                event.user?.email = null
                event.user?.username = null
                event
            }
        }
    }
}
```

### Clerk Authentication

```kotlin
import com.clerk.android.Clerk

class AuthManager(private val context: Context) {
    private val clerk = Clerk.getInstance(context)
    
    suspend fun signIn(): String {
        val session = clerk.signIn()
        return session.getToken()
    }
    
    suspend fun getToken(): String {
        return clerk.session?.getToken() 
            ?: throw AuthException("Not authenticated")
    }
}
```

### Network Layer with Retrofit

```kotlin
interface TallyApiService {
    @GET("api/challenges")
    suspend fun getChallenges(
        @Header("Authorization") token: String
    ): List<Challenge>
    
    @POST("api/entries")
    suspend fun createEntry(
        @Header("Authorization") token: String,
        @Body request: CreateEntryRequest
    ): IdResponse
}

// With retry interceptor
val okHttpClient = OkHttpClient.Builder()
    .addInterceptor(RetryInterceptor(maxRetries = 3))
    .build()
```

## Offline Support (Future)

### Strategy

1. **Read**: Cache API responses locally
2. **Write**: Queue mutations, sync when online
3. **Conflict**: Last-write-wins with timestamps

### Implementation Notes

- iOS: Use Core Data or SwiftData
- Android: Use Room database
- Sync queue: Store pending mutations with timestamps
- Background sync: Use BackgroundTasks (iOS) / WorkManager (Android)

## Testing

Use Nx targets from the repo root:

### iOS

```bash
nx run tally-ios:test
nx run tally-ios:e2e
```

### Android

```bash
nx run tally-android:test
nx run tally-android:e2e
```

## CI/CD

See `.github/workflows/ios.yml` and `.github/workflows/android.yml` for:
- Build verification
- Unit tests
- (Future) TestFlight / Play Store deployment
