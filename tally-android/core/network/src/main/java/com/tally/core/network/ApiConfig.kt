package com.tally.core.network

class ApiConfig(private val deployment: String) {
  val baseUrl: String = "https://${deployment}.convex.site/api/v1"
}
