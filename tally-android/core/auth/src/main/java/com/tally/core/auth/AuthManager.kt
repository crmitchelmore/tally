package com.tally.core.auth

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import java.net.HttpURLConnection
import java.net.URL

/**
 * Manages authentication state using Clerk web-based OAuth via CustomTabs.
 * Stores JWT securely in EncryptedSharedPreferences for offline access.
 * Calls POST /api/v1/auth/user after successful auth to provision user in backend.
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

        // Check for existing stored token (offline support)
        checkSession()
    }

    /**
     * Check for existing session and update state.
     */
    suspend fun checkSession() {
        val storedToken = tokenStorage.getToken()
        if (storedToken != null) {
            // Validate by calling API
            val user = provisionUser(storedToken)
            if (user != null) {
                _authState.value = AuthState.SignedIn(user, storedToken)
            } else {
                // Token invalid, clear it
                tokenStorage.clearToken()
                _authState.value = AuthState.SignedOut
            }
        } else {
            _authState.value = AuthState.SignedOut
        }
    }

    /**
     * Launch Clerk OAuth sign-in via CustomTabs.
     * The web app will handle the OAuth flow and redirect back with a token.
     */
    fun launchSignIn(context: Context) {
        val signInUrl = "$apiBaseUrl/sign-in?redirect_url=tally://auth/callback"
        val customTabsIntent = CustomTabsIntent.Builder()
            .setShowTitle(true)
            .build()
        customTabsIntent.launchUrl(context, Uri.parse(signInUrl))
    }

    /**
     * Handle deep link callback with auth token.
     * Called when app receives tally://auth/callback?token=xxx
     */
    suspend fun handleAuthCallback(token: String) {
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
     * Refresh the session token.
     */
    suspend fun refreshToken(): String? {
        // Re-validate current token
        val token = tokenStorage.getToken() ?: return null
        val user = provisionUser(token)
        return if (user != null) token else null
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
}
