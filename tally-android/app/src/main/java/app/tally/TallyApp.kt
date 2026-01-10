package app.tally

import android.app.Application
import com.clerk.api.Clerk
import app.tally.featureflags.FeatureFlags
import io.sentry.android.core.SentryAndroid
import io.sentry.SentryOptions

class TallyApp : Application() {
  override fun onCreate() {
    super.onCreate()

    // Initialize Sentry (first, to capture any startup errors)
    val sentryDsn = BuildConfig.SENTRY_DSN
    if (sentryDsn.isNotBlank()) {
      SentryAndroid.init(this) { options: SentryOptions ->
        options.dsn = sentryDsn
        options.environment = "production"
        
        // Performance monitoring
        options.tracesSampleRate = 0.1
        
        // ANR detection
        options.isAnrEnabled = true
        options.anrTimeoutIntervalMillis = 5000
        
        // Enable breadcrumbs
        options.isEnableActivityLifecycleBreadcrumbs = true
        options.isEnableAppComponentBreadcrumbs = true
        options.isEnableSystemEventBreadcrumbs = true
        options.isEnableNetworkEventBreadcrumbs = true
        
        // Privacy: don't attach screenshots by default
        options.isAttachScreenshot = false
        options.isAttachViewHierarchy = false
        
        // Release tracking
        options.release = "app.tally@${BuildConfig.VERSION_NAME}+${BuildConfig.VERSION_CODE}"
        
        // Scrub PII from events
        options.setBeforeSend { event, _ ->
          event.user?.email = null
          event.user?.username = null
          event
        }
      }
    }

    // Initialize Clerk
    val clerkKey = BuildConfig.CLERK_PUBLISHABLE_KEY
    if (clerkKey.isNotBlank()) {
      Clerk.initialize(this, publishableKey = clerkKey)
    }

    // Initialize LaunchDarkly
    val ldKey = BuildConfig.LAUNCHDARKLY_MOBILE_KEY
    if (ldKey.isNotBlank()) {
      FeatureFlags.initialize(this, ldKey)
    }
  }
}
