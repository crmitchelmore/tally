package com.tally.core.network

import kotlinx.serialization.Serializable

@Serializable
data class AuthUserResponse(
  val userId: String,
  val clerkId: String,
)
