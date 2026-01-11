package app.tally.analytics

import android.content.Context
import com.posthog.PostHog
import com.posthog.android.PostHogAndroid
import com.posthog.android.PostHogAndroidConfig
import io.sentry.Sentry
import io.sentry.protocol.User

/**
 * Tally Analytics for Android
 *
 * Provides unified analytics tracking with PostHog and error reporting with Sentry.
 * See docs/ANALYTICS.md for the event taxonomy.
 */
object TallyAnalytics {
    @Volatile
    private var isInitialized = false

    /**
     * Initialize analytics (call once from Application.onCreate)
     */
    fun configure(
        context: Context,
        posthogApiKey: String?,
        appVersion: String
    ) {
        if (isInitialized) return

        // Initialize PostHog
        if (!posthogApiKey.isNullOrBlank()) {
            val config = PostHogAndroidConfig(
                apiKey = posthogApiKey,
                host = "https://app.posthog.com",
            ).apply {
                captureScreenViews = false
                captureDeepLinks = false
            }

            PostHogAndroid.setup(context, config)

            PostHog.register("platform", "android")
            PostHog.register("app_version", appVersion)
        }

        // Note: Sentry is auto-initialized by the Gradle plugin
        // Just ensure user is cleared on init
        Sentry.configureScope { scope ->
            scope.user = null
        }

        isInitialized = true
    }

    /**
     * Identify the current user (ID is hashed for privacy)
     */
    fun identify(userId: String, traits: Map<String, Any>? = null) {
        val hashedId = hashUserId(userId)
        PostHog.identify(hashedId, traits ?: emptyMap(), emptyMap())

        val sentryUser = User().apply {
            id = hashedId
        }
        Sentry.setUser(sentryUser)
    }

    /**
     * Clear user identity on sign out
     */
    fun reset() {
        PostHog.reset()
        Sentry.setUser(null)
    }

    /**
     * Track an analytics event
     */
    fun track(event: String, properties: Map<String, Any>? = null) {
        val props = (properties ?: emptyMap()).toMutableMap()
        props["platform"] = "android"

        PostHog.capture(event, null, props)
    }

    // MARK: - Convenience Methods

    fun trackEntryCreated(count: Int, hasNote: Boolean, hasSets: Boolean, hasFeeling: Boolean) {
        track("entry_created", mapOf(
            "count" to count,
            "has_note" to hasNote,
            "has_sets" to hasSets,
            "has_feeling" to hasFeeling
        ))
    }

    fun trackChallengeCreated(timeframeUnit: String, targetNumber: Int, isPublic: Boolean) {
        track("challenge_created", mapOf(
            "timeframe_unit" to timeframeUnit,
            "target_number" to targetNumber,
            "is_public" to isPublic
        ))
    }

    fun trackStreakAchieved(streakDays: Int, challengeId: String) {
        track("streak_achieved", mapOf(
            "streak_days" to streakDays,
            "challenge_id" to challengeId
        ))
    }

    fun trackChallengeViewed(challengeId: String, isOwn: Boolean) {
        track("challenge_viewed", mapOf(
            "challenge_id" to challengeId,
            "is_own" to isOwn
        ))
    }

    // MARK: - Error Tracking

    /**
     * Capture an exception to Sentry
     */
    fun captureException(throwable: Throwable, context: Map<String, Any>? = null) {
        if (context != null) {
            Sentry.configureScope { scope ->
                context.forEach { (key, value) ->
                    scope.setExtra(key, value.toString())
                }
            }
        }
        Sentry.captureException(throwable)
    }

    /**
     * Add a breadcrumb for debugging
     */
    fun addBreadcrumb(message: String, category: String? = null) {
        val breadcrumb = io.sentry.Breadcrumb().apply {
            this.message = message
            this.category = category ?: "app"
        }
        Sentry.addBreadcrumb(breadcrumb)
    }

    // MARK: - Private

    private fun hashUserId(userId: String): String {
        var hash: Long = 5381
        for (char in userId) {
            hash = ((hash shl 5) + hash) + char.code
        }
        return "u_${hash.toULong().toString(36)}"
    }
}
