package app.tally

/**
 * Environment configuration helper.
 * Values are baked into BuildConfig at compile time based on build type (debug/release).
 * See app/build.gradle.kts for the source of these values.
 */
object Env {
  fun clerkPublishableKey(): String = BuildConfig.CLERK_PUBLISHABLE_KEY

  fun launchDarklyMobileKey(): String = BuildConfig.LAUNCHDARKLY_MOBILE_KEY
}
