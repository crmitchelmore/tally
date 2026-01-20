package com.tally.core.auth

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import java.net.HttpURLConnection
import java.net.URL

/**
 * Manages authentication state.
 * Uses web-based OAuth flow via CustomTabs (Clerk SDK integration pending).
 * 
 * Note: Full Clerk Android SDK integration is blocked pending SDK availability
 * on Maven Central. This implementation provides the auth architecture and 
 * secure token storage ready for SDK integration.
 */
class AuthManager(
    private val context: Context,
    private val publishableKey: String,
    private val apiBaseUrl: String
) {
    private val tokenStorage = SecureTokenStorage(context)
    private val json = Json { ignoreUnknownKeys = true }

    private val _authState = MutableStateFlow<AuthState>(AuthState.Loading)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    private var isInitialized = false

    /**
     * Initialize auth and check for existing session.
     */
    suspend fun initialize() {
        if (isInitialized) return
        isInitialized = true

        // Check for existing token
        checkSession()
    }

    /**
     * Check for existing session and update state.
     */
    suspend fun checkSession() {
        val storedToken = tokenStorage.getToken()
        if (storedToken != null) {
            // Validate token by calling API
            val user = provisionUser(storedToken)
            if (user != null) {
                _authState.value = AuthState.SignedIn(user, storedToken)
            } else {
                // Token invalid, clear and show sign-out
                tokenStorage.clearToken()
                _authState.value = AuthState.SignedOut
            }
        } else {
            _authState.value = AuthState.SignedOut
        }
    }

    /**
     * Handle successful sign in with token.
     * Called after OAuth flow completes.
     */
    suspend fun handleSignIn(token: String) {
        // Store token securely
        tokenStorage.saveToken(token)

        // Provision user in backend
        val user = provisionUser(token)
        if (user != null) {
            _authState.value = AuthState.SignedIn(user, token)
        } else {
            _authState.value = AuthState.Error("Failed to provision user")
        }
    }

    /**
     * Sign out and clear stored credentials.
     */
    suspend fun signOut() {
        tokenStorage.clearToken()
        _authState.value = AuthState.SignedOut
    }

    /**
     * Get the current JWT token for API requests.
     */
    fun getToken(): String? = tokenStorage.getToken()

    /**
     * Get the OAuth sign-in URL for Clerk.
     * Opens in CustomTabs browser.
     */
    fun getSignInUrl(): String {
        // Clerk hosted sign-in page with redirect back to app
        return "$apiBaseUrl/sign-in?redirect_url=tally://auth/callback"
    }

    /**
     * Call POST /api/v1/auth/user to provision user in backend.
     */
    private suspend fun provisionUser(token: String): TallyUser? = withContext(Dispatchers.IO) {
        try {
            val url = URL("$apiBaseUrl/api/v1/auth/user")
            val connection = url.openConnection() as HttpURLConnection

            connection.apply {
                requestMethod = "POST"
                setRequestProperty("Authorization", "Bearer $token")
                setRequestProperty("Content-Type", "application/json")
                doOutput = false
                connectTimeout = 10_000
                readTimeout = 10_000
            }

            val responseCode = connection.responseCode
            if (responseCode == HttpURLConnection.HTTP_OK) {
                val responseBody = connection.inputStream.bufferedReader().readText()
                val response = json.decodeFromString<AuthUserResponse>(responseBody)
                response.user
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    /**
     * Refresh the session token.
     */
    suspend fun refreshToken(): String? {
        // Token refresh would be handled by Clerk SDK
        // For now, return existing token
        return tokenStorage.getToken()
    }
}
