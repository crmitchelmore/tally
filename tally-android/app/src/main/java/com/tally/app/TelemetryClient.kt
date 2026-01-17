package com.tally.app

import android.util.Log
import com.posthog.android.PostHog
import com.posthog.android.Properties
import com.tally.core.auth.TelemetryBridge
import com.tally.core.auth.AppContextHolder
import java.util.UUID

object TelemetryClient {
  private const val TAG = "tally.telemetry"
  private var sessionId: String = UUID.randomUUID().toString()

  fun init() {
    val posthog = PostHog.Builder(
      BuildConfig.POSTHOG_API_KEY,
      BuildConfig.POSTHOG_HOST
    )
      .captureApplicationLifecycleEvents(false)
      .build()
    PostHog.setSingletonInstance(posthog)
    TelemetryBridge.track = { event, properties ->
      capture(event, properties)
      logWideEvent(event, properties)
    }
  }

  fun capture(event: String, properties: Map<String, Any?>) {
    if (BuildConfig.POSTHOG_API_KEY.isBlank()) return
    val props = baseProperties().apply {
      properties.forEach { (key, value) ->
        if (value != null) putValue(key, value)
      }
    }
    PostHog.with(AppContextHolder.context).capture(event, props)
  }

  fun logWideEvent(event: String, properties: Map<String, Any?>) {
    val payload = mutableMapOf<String, Any?>(
      "type" to "wide_event",
      "event" to event,
      "timestamp" to System.currentTimeMillis(),
      "session_id" to sessionId
    )
    payload.putAll(baseProperties().toMap())
    payload.putAll(properties)
    Log.i(TAG, payload.toString())
  }

  private fun baseProperties(): Properties {
    return Properties().apply {
      putValue("platform", "android")
      putValue("env", BuildConfig.TELEMETRY_ENV)
      putValue("app_version", BuildConfig.VERSION_NAME)
      putValue("build_number", BuildConfig.VERSION_CODE.toString())
      putValue("session_id", sessionId)
      val userId = AppContextHolder.userId
      if (!userId.isNullOrBlank()) {
        putValue("user_id", userId)
        putValue("is_signed_in", true)
      } else {
        putValue("is_signed_in", false)
      }
    }
  }
}
