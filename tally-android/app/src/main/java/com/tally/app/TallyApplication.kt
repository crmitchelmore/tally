package com.tally.app

import android.app.Application
import com.clerk.api.Clerk
import com.tally.core.auth.AppContextHolder

class TallyApplication : Application() {
  override fun onCreate() {
    super.onCreate()
    AppContextHolder.context = applicationContext
    Clerk.initialize(this, BuildConfig.CLERK_PUBLISHABLE_KEY)
    TelemetryClient.init()
    TelemetryClient.capture("app_opened", emptyMap())
    TelemetryClient.logWideEvent("app_opened", emptyMap())
  }
}
