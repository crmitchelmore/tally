package com.tally.core.auth

import com.tally.app.BuildConfig

object AuthEnvironment {
  fun convexDeployment(): String = BuildConfig.CONVEX_DEPLOYMENT
}
