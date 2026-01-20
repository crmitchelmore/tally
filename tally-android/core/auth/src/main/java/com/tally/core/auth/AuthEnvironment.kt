package com.tally.core.auth

import com.tally.core.auth.BuildConfig

object AuthEnvironment {
  fun convexDeployment(): String = BuildConfig.CONVEX_DEPLOYMENT
}
