package app.tally.core.telemetry

import android.app.Application
import android.content.Context
import com.posthog.PostHog
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig
import io.sentry.Sentry
import io.sentry.android.core.SentryAndroid

/** No SDK is initialised until its separate, persisted permission is enabled. */
object PrivacyTelemetry {
    private lateinit var application: Application
    private var key = ""
    private var dsn = ""
    private var version = ""
    private var analyticsStarted = false
    private var diagnosticsStarted = false
    private val prefs get() = application.getSharedPreferences("tally_privacy", Context.MODE_PRIVATE)
    val hasChosen get() = ::application.isInitialized && prefs.getBoolean("chosen_v1", false)
    val analyticsEnabled get() = hasChosen && prefs.getBoolean("analytics", false)
    val diagnosticsEnabled get() = hasChosen && prefs.getBoolean("diagnostics", false)

    fun configure(app: Application, posthogKey: String, sentryDsn: String, appVersion: String) {
        application = app
        key = posthogKey
        dsn = sentryDsn
        version = appVersion
        applyChoice()
    }

    fun save(analytics: Boolean, diagnostics: Boolean) {
        prefs.edit().putBoolean("analytics", analytics).putBoolean("diagnostics", diagnostics)
            .putBoolean("chosen_v1", true).commit()
        applyChoice()
    }

    private fun applyChoice() {
        if (analyticsEnabled && key.isNotBlank() && !analyticsStarted) {
            val config = PostHogAndroidConfig(key, "https://eu.i.posthog.com",
                captureApplicationLifecycleEvents = false, captureScreenViews = false, captureDeepLinks = false)
            config.sessionReplay = false
            config.preloadFeatureFlags = false
            PostHogAndroid.setup(application, config)
            PostHog.optIn()
            analyticsStarted = true
            capture("app_opened")
        } else if (!analyticsEnabled && analyticsStarted) {
            analyticsStarted = false
            PostHog.optOut()
            PostHog.close()
        }
        if (diagnosticsEnabled && dsn.isNotBlank() && !diagnosticsStarted) {
            SentryAndroid.init(application) { options ->
                options.dsn = dsn
                options.isSendDefaultPii = false
                options.tracesSampleRate = 0.0
                options.isAttachScreenshot = false
                options.isAttachViewHierarchy = false
                options.isEnableAutoSessionTracking = false
                options.maxBreadcrumbs = 0
                options.setBeforeSend { event, _ ->
                    event.user = null
                    if (diagnosticsEnabled) event else null
                }
            }
            diagnosticsStarted = true
        } else if (!diagnosticsEnabled && diagnosticsStarted) {
            Sentry.close()
            diagnosticsStarted = false
        }
    }

    fun capture(event: String) {
        if (analyticsStarted && analyticsEnabled && event in setOf("app_opened", "challenge_created", "entry_created")) {
            PostHog.capture(event, properties = mapOf("platform" to "android", "source" to "client", "app_version" to version))
        }
    }
}
