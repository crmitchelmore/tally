package com.tally.app

import android.util.Log
import com.posthog.PostHog
import com.posthog.PostHogConfig
import com.tally.core.auth.AppContextHolder
import com.tally.core.auth.TelemetryBridge
import java.util.UUID

object TelemetryClient {
  private const val TAG = "tally.telemetry"
  private var sessionId: String = UUID.randomUUID().toString()

  fun init() {
    if (BuildConfig.POSTHOG_API_KEY.isNotBlank()) {
      val config = PostHogConfig(BuildConfig.POSTHOG_API_KEY, BuildConfig.POSTHOG_HOST)
      PostHog.setup(config)
    }
    TelemetryBridge.track = { event, properties ->
      capture(event, properties)
      logWideEvent(event, properties)
    }
  }

  fun capture(event: String, properties: Map<String, Any?>) {
    if (BuildConfig.POSTHOG_API_KEY.isBlank()) return
    val safeProperties = properties.filterValues { it != null }.mapValues { it.value as Any }
    PostHog.capture(
      event,
      AppContextHolder.userId ?: sessionId,
      safeProperties,
      emptyMap(),
      emptyMap(),
      baseProperties(),
      null
    )
  }

  fun logWideEvent(event: String, properties: Map<String, Any?>) {
    val payload = mutableMapOf<String, Any?>(
      "type" to "wide_event",
      "event" to event,
      "timestamp" to System.currentTimeMillis(),
      "session_id" to sessionId
    )
    payload.putAll(baseProperties().mapValues { it.value })
    payload.putAll(properties)
    Log.i(TAG, payload.toString())
  }

  private fun baseProperties(): Map<String, String> {
    val base = mutableMapOf(
      "platform" to "android",
      "env" to BuildConfig.TELEMETRY_ENV,
      "app_version" to BuildConfig.VERSION_NAME,
      "build_number" to BuildConfig.VERSION_CODE.toString(),
      "session_id" to sessionId
    )
    val userId = AppContextHolder.userId
    if (!userId.isNullOrBlank()) {
      base["user_id"] = userId
      base["is_signed_in"] = "true"
    } else {
      base["is_signed_in"] = "false"
    }
    return base
  }
}
