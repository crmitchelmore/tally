package com.tally.core.auth

/**
 * Represents the current authentication state.
 */
sealed interface AuthState {
    /** Checking if user is authenticated. */
    data object Loading : AuthState

    /** User is signed in. */
    data class SignedIn(
        val user: TallyUser,
        val token: String
    ) : AuthState

    /** User is not signed in. */
    data object SignedOut : AuthState

    /** Authentication error occurred. */
    data class Error(val message: String) : AuthState
}
