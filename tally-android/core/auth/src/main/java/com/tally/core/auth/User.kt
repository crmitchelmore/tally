package com.tally.core.auth

import kotlinx.serialization.Serializable

/**
 * Represents the authenticated user.
 */
@Serializable
data class TallyUser(
    val id: String,
    val clerkId: String,
    val email: String? = null,
    val name: String? = null,
    val avatarUrl: String? = null,
    val createdAt: String,
    val updatedAt: String
)

/**
 * Response from POST /api/v1/auth/user endpoint.
 */
@Serializable
data class AuthUserResponse(
    val user: TallyUser
)
