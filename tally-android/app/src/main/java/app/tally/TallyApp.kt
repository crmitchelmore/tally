package app.tally

import android.app.Application
import com.clerk.api.Clerk
import app.tally.featureflags.FeatureFlags
import app.tally.observability.TallyTelemetry
import io.sentry.android.core.SentryAndroid
import io.sentry.android.core.SentryAndroidOptions

class TallyApp : Application() {
  override fun onCreate() {
    super.onCreate()

    // Initialize Sentry (first, to capture any startup errors)
    val sentryDsn = BuildConfig.SENTRY_DSN
    if (sentryDsn.isNotBlank()) {
      SentryAndroid.init(this) { options: SentryAndroidOptions ->
        options.dsn = sentryDsn
        options.environment = if (BuildConfig.DEBUG) "development" else "production"
        
        // Performance monitoring
        options.tracesSampleRate = 0.1
        
        // ANR detection (configured via Sentry auto-init defaults)
        options.isAnrEnabled = true
        
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

    // Initialize OpenTelemetry for Grafana Cloud
    val otelEndpoint = BuildConfig.OTEL_EXPORTER_OTLP_ENDPOINT
    val otelToken = BuildConfig.GRAFANA_CLOUD_OTLP_TOKEN
    if (otelEndpoint.isNotBlank() && otelToken.isNotBlank()) {
      TallyTelemetry.initialize(
        context = this,
        endpoint = otelEndpoint,
        token = otelToken,
        environment = if (BuildConfig.DEBUG) "development" else "production",
        version = "${BuildConfig.VERSION_NAME}+${BuildConfig.VERSION_CODE}"
      )
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
