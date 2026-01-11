package app.tally.featureflags

import android.app.Application
import com.launchdarkly.sdk.ContextKind
import com.launchdarkly.sdk.LDContext
import com.launchdarkly.sdk.android.FeatureFlagChangeListener
import com.launchdarkly.sdk.android.LDClient
import com.launchdarkly.sdk.android.LDConfig
import com.launchdarkly.sdk.android.env.AutoEnvAttributes
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Service for managing feature flags via LaunchDarkly.
 * Follows the identity strategy from launchdarkly.md:
 * - key: clerkId (authenticated) or anonymous device id
 * - platform: "android"
 * - env: determined from build configuration
 */
object FeatureFlags {
  private var client: LDClient? = null
  private var isInitialized = false

  // Observable flag values for Compose
  private val _streaksEnabled = MutableStateFlow(false)
  val streaksEnabled: StateFlow<Boolean> = _streaksEnabled.asStateFlow()

  private val currentEnvironment: String
    get() = if (app.tally.BuildConfig.DEBUG) "dev" else "prod"

  /**
   * Initialize LaunchDarkly with the mobile key.
   * Call this in Application.onCreate().
   */
  fun initialize(application: Application, mobileKey: String) {
    if (mobileKey.isBlank() || isInitialized) return

    val config = LDConfig.Builder(AutoEnvAttributes.Enabled)
      .mobileKey(mobileKey)
      .build()

    // Start with anonymous context
    val context = LDContext.builder(ContextKind.DEFAULT, "anonymous")
      .set("anonymous", true)
      .set("platform", "android")
      .set("env", currentEnvironment)
      .build()

    client = LDClient.init(application, config, context, 5)
    isInitialized = true

    refreshFlagValues()
    observeFlagChanges()
  }

  /**
   * Identify the user after authentication.
   * @param clerkId The Clerk user ID
   * @param name Optional user display name
   * @param email Optional user email
   */
  fun identify(clerkId: String, name: String? = null, email: String? = null) {
    val builder = LDContext.builder(ContextKind.DEFAULT, clerkId)
      .set("anonymous", false)
      .set("platform", "android")
      .set("env", currentEnvironment)

    name?.let { builder.name(it) }
    email?.let { builder.set("email", it) }

    client?.identify(builder.build())
    refreshFlagValues()
  }

  /**
   * Reset to anonymous context (on logout).
   */
  fun resetToAnonymous() {
    val context = LDContext.builder(ContextKind.DEFAULT, "anonymous")
      .set("anonymous", true)
      .set("platform", "android")
      .set("env", currentEnvironment)
      .build()

    client?.identify(context)
    refreshFlagValues()
  }

  /**
   * Check if a boolean flag is enabled.
   */
  fun isEnabled(flagKey: String, defaultValue: Boolean = false): Boolean {
    return client?.boolVariation(flagKey, defaultValue) ?: defaultValue
  }

  /**
   * Get a string flag value.
   */
  fun stringValue(flagKey: String, defaultValue: String = ""): String {
    return client?.stringVariation(flagKey, defaultValue) ?: defaultValue
  }

  private fun refreshFlagValues() {
    _streaksEnabled.value = isEnabled("streaks-enabled")
  }

  private fun observeFlagChanges() {
    client?.registerFeatureFlagListener(
      "streaks-enabled",
      FeatureFlagChangeListener { refreshFlagValues() }
    )
  }
}
