package app.tally

object Env {
  private fun isDebug(): Boolean = BuildConfig.DEBUG

  fun clerkPublishableKey(): String {
    return if (isDebug()) {
      System.getenv("CLERK_PUBLISHABLE_KEY_DEV") ?: System.getenv("CLERK_PUBLISHABLE_KEY") ?: ""
    } else {
      System.getenv("CLERK_PUBLISHABLE_KEY_PROD") ?: System.getenv("CLERK_PUBLISHABLE_KEY") ?: ""
    }
  }

  fun launchDarklyMobileKey(): String {
    return if (isDebug()) {
      System.getenv("LAUNCHDARKLY_MOBILE_KEY_DEV") ?: System.getenv("LAUNCHDARKLY_MOBILE_KEY") ?: ""
    } else {
      System.getenv("LAUNCHDARKLY_MOBILE_KEY_PROD") ?: System.getenv("LAUNCHDARKLY_MOBILE_KEY") ?: ""
    }
  }
}
