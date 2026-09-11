package com.tally.app

import android.app.Application
import com.clerk.api.Clerk

class TallyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        app.tally.core.telemetry.PrivacyTelemetry.configure(this, BuildConfig.POSTHOG_KEY, BuildConfig.SENTRY_DSN, BuildConfig.VERSION_NAME)
        Clerk.initialize(
            context = this,
            publishableKey = BuildConfig.CLERK_PUBLISHABLE_KEY
        )
    }
}
