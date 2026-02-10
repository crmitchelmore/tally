package com.tally.core.auth

import android.content.Context
import android.util.Log
import com.clerk.api.Clerk
import com.clerk.api.network.serialization.ClerkResult
import com.clerk.api.session.fetchToken
import com.clerk.api.signin.SignIn
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import java.net.HttpURLConnection
import java.net.URL

/**
 * Manages authentication state using the native Clerk Android SDK.
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
     * Initialize auth by waiting for Clerk SDK readiness then checking session.
     */
    suspend fun initialize() {
        if (isInitialized) return
        isInitialized = true
        
        // Check if user previously chose local-only mode
        if (isLocalOnlyModeEnabled()) {
            _authState.value = AuthState.OfflineMode
            return
        }

        // Wait for Clerk SDK to be ready
        Clerk.isInitialized.first { it }
        
        // Check for existing session
        updateAuthState()
    }
    
    fun isLocalOnlyModeEnabled(): Boolean {
        return prefs.getBoolean(KEY_LOCAL_ONLY_MODE, false)
    }
    
    fun enableLocalOnlyMode() {
        prefs.edit().putBoolean(KEY_LOCAL_ONLY_MODE, true).apply()
        _authState.value = AuthState.OfflineMode
    }
    
    suspend fun disableLocalOnlyMode() {
        prefs.edit().putBoolean(KEY_LOCAL_ONLY_MODE, false).apply()
        updateAuthState()
    }

    /**
     * Update auth state from the native Clerk session.
     */
    private suspend fun updateAuthState() {
        val session = Clerk.session
        if (session != null) {
            val tokenResult = session.fetchToken()
            if (tokenResult is ClerkResult.Success) {
                val jwt = tokenResult.value.jwt
                tokenStorage.saveToken(jwt)
                val user = provisionUser(jwt)
                if (user != null) {
                    _authState.value = AuthState.SignedIn(user, jwt)
                    return
                }
            }
            // Fallback to stored token
            val storedToken = tokenStorage.getToken()
            if (storedToken != null) {
                val user = provisionUser(storedToken)
                if (user != null) {
                    _authState.value = AuthState.SignedIn(user, storedToken)
                    return
                }
            }
            _authState.value = AuthState.Error("Failed to provision user")
        } else {
            // No active session — try stored token for offline
            val storedToken = tokenStorage.getToken()
            if (storedToken != null) {
                val user = provisionUser(storedToken)
                if (user != null) {
                    _authState.value = AuthState.SignedIn(user, storedToken)
                    return
                }
                tokenStorage.clearToken()
            }
            _authState.value = AuthState.SignedOut
        }
    }

    /**
     * Sign in with email and password using native Clerk SDK.
     */
    suspend fun signInWithPassword(email: String, password: String): Result<Unit> {
        return try {
            // Don't set Loading here — SignInScreen manages its own loading state.
            val result = SignIn.create(
                SignIn.CreateParams.Strategy.Password(
                    identifier = email,
                    password = password
                )
            )
            when (result) {
                is ClerkResult.Success -> {
                    val signIn = result.value
                    if (signIn.status == SignIn.Status.COMPLETE) {
                        updateAuthState()
                        Result.success(Unit)
                    } else {
                        _authState.value = AuthState.SignedOut
                        Result.failure(Exception("Sign-in requires additional verification"))
                    }
                }
                is ClerkResult.Failure -> {
                    _authState.value = AuthState.SignedOut
                    val msg = result.throwable?.message ?: "Sign-in failed"
                    Log.e("TallyAuth", "SignIn failed: $msg")
                    Result.failure(Exception(msg))
                }
            }
        } catch (e: Exception) {
            Log.e("TallyAuth", "SignIn exception: ${e.message}")
            _authState.value = AuthState.SignedOut
            Result.failure(e)
        }
    }

    /**
     * Sign out and clear stored credentials.
     */
    suspend fun signOut() {
        try { Clerk.signOut() } catch (_: Exception) { }
        tokenStorage.clearToken()
        prefs.edit().putBoolean(KEY_LOCAL_ONLY_MODE, false).apply()
        _authState.value = AuthState.SignedOut
    }

    fun getToken(): String? = tokenStorage.getToken()

    /**
     * Refresh the session token from native Clerk session.
     */
    suspend fun refreshToken(): String? {
        val session = Clerk.session ?: return null
        val result = session.fetchToken()
        if (result is ClerkResult.Success) {
            val jwt = result.value.jwt
            tokenStorage.saveToken(jwt)
            return jwt
        }
        return null
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
            if (responseCode in 200..299) {
                val responseBody = connection.inputStream.bufferedReader().readText()
                val response = json.decodeFromString<AuthUserResponse>(responseBody)
                response.user
            } else {
                val errorBody = connection.errorStream?.bufferedReader()?.readText() ?: "no body"
                Log.e("TallyAuth", "provisionUser: $responseCode: $errorBody")
                null
            }
        } catch (e: Exception) {
            Log.e("TallyAuth", "provisionUser: ${e.message}")
            null
        }
    }
}
