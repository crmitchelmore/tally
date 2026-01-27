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
    private val prefs = context.getSharedPreferences("tally_auth_prefs", Context.MODE_PRIVATE)

    private val _authState = MutableStateFlow<AuthState>(AuthState.Loading)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    private var isInitialized = false
    
    companion object {
        private const val KEY_LOCAL_ONLY_MODE = "local_only_mode_enabled"
    }

    /**
     * Initialize auth and check for existing session.
     */
    suspend fun initialize() {
        if (isInitialized) return
        isInitialized = true
        
        // Check if user previously chose local-only mode
        if (isLocalOnlyModeEnabled()) {
            _authState.value = AuthState.OfflineMode
            return
        }

        // Check for existing stored token (offline support)
        checkSession()
    }
    
    /**
     * Check if local-only mode is enabled.
     */
    fun isLocalOnlyModeEnabled(): Boolean {
        return prefs.getBoolean(KEY_LOCAL_ONLY_MODE, false)
    }
    
    /**
     * Enable local-only mode (user choice).
     */
    fun enableLocalOnlyMode() {
        prefs.edit().putBoolean(KEY_LOCAL_ONLY_MODE, true).apply()
        _authState.value = AuthState.OfflineMode
    }
    
    /**
     * Disable local-only mode and return to sign-in.
     */
    suspend fun disableLocalOnlyMode() {
        prefs.edit().putBoolean(KEY_LOCAL_ONLY_MODE, false).apply()
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
     * Flow:
     * 1. Opens /sign-in with forceRedirectUrl to /auth/native-callback
     * 2. User signs in via Clerk
     * 3. After sign-in, Clerk redirects to /auth/native-callback
     * 4. Native callback page gets JWT and redirects to tally://auth/callback?token=xxx
     */
    fun launchSignIn(context: Context) {
        // Open sign-in page that will redirect to native-callback after auth
        val signInUrl = "$apiBaseUrl/sign-in?force_redirect_url=${Uri.encode("$apiBaseUrl/auth/native-callback")}"
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
        prefs.edit().putBoolean(KEY_LOCAL_ONLY_MODE, false).apply()
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
