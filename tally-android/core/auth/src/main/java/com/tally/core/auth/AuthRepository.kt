package com.tally.core.auth

import com.clerk.api.Clerk
import com.clerk.api.network.serialization.onFailure
import com.clerk.api.network.serialization.onSuccess
import com.clerk.api.network.serialization.errorMessage
import com.clerk.api.session.fetchToken
import com.tally.core.network.ApiClient
import com.tally.core.network.ApiConfig
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class AuthRepository {
  private val secureStore = SecureTokenStore()
  private val apiClient = ApiClient(ApiConfig(AuthEnvironment.convexDeployment()))
  private val _authState = MutableStateFlow(AuthState())
  val authState: StateFlow<AuthState> = _authState.asStateFlow()

  suspend fun syncUser(onSuccess: (() -> Unit)? = null) {
    _authState.value = _authState.value.copy(syncState = SyncState.Syncing, error = null)
    val session = Clerk.session
    if (session == null) {
      _authState.value = _authState.value.copy(syncState = SyncState.Error("Missing session"))
      return
    }
    session.fetchToken()
      .onSuccess { tokenResource ->
        val token = tokenResource.jwt
        if (token.isNotBlank()) {
          secureStore.saveToken(token)
          val result = apiClient.postAuthUser(token)
          if (result.isSuccess) {
            val user = result.getOrNull()
            _authState.value = _authState.value.copy(
              userName = user?.clerkId ?: "",
              syncState = SyncState.Idle,
              error = null
            )
            AppContextHolder.userId = user?.clerkId
            TelemetryBridge.track(
              "auth_signed_in",
              mapOf(
                "user_id" to user?.clerkId,
                "is_signed_in" to true
              )
            )
            onSuccess?.invoke()
          } else {
            _authState.value = _authState.value.copy(
              syncState = SyncState.Error("Unable to sync"),
              error = result.exceptionOrNull()?.message
            )
          }
        } else {
          _authState.value = _authState.value.copy(syncState = SyncState.Error("Missing token"))
        }
      }
      .onFailure {
        _authState.value = _authState.value.copy(syncState = SyncState.Error(it.errorMessage))
      }
  }

  fun clearSession() {
    secureStore.clearToken()
    _authState.value = AuthState()
    AppContextHolder.userId = null
    TelemetryBridge.track(
      "auth_signed_out",
      mapOf(
        "user_id" to null,
        "is_signed_in" to false
      )
    )
  }

  fun currentToken(): String? = secureStore.loadToken()

  fun reportError(message: String) {
    _authState.value = _authState.value.copy(syncState = SyncState.Error(message))
  }
}

data class AuthState(
  val userName: String = "",
  val syncState: SyncState = SyncState.Idle,
  val error: String? = null
)

sealed interface SyncState {
  data object Idle : SyncState
  data object Syncing : SyncState
  data class Error(val message: String) : SyncState
}
