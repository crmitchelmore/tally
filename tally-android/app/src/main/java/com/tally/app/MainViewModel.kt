package com.tally.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.work.Constraints
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import com.clerk.api.Clerk
import com.tally.core.auth.AuthEnvironment
import com.tally.core.auth.AuthRepository
import com.tally.core.auth.AuthState
import com.tally.core.auth.AppContextHolder
import com.tally.core.network.ApiClient
import com.tally.core.network.ApiConfig
import com.tally.core.network.ApiRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

class MainViewModel : ViewModel() {
  private val authRepository = AuthRepository()
  private val apiRepository = ApiRepository(
    context = AppContextHolder.context,
    apiClient = ApiClient(ApiConfig(AuthEnvironment.convexDeployment())),
    tokenProvider = { authRepository.currentToken() },
    onEnqueue = { enqueueSync() }
  )
  private val _uiState = MutableStateFlow<MainUiState>(MainUiState.Loading)
  val uiState = _uiState.asStateFlow()

  init {
    apiRepository.onTelemetryEvent = { event, properties ->
      TelemetryClient.capture(event, properties)
      TelemetryClient.logWideEvent(event, properties)
    }
    combine(Clerk.isInitialized, Clerk.userFlow, authRepository.authState) { initialized, user, state ->
      when {
        !initialized -> MainUiState.Loading
        user == null -> MainUiState.SignedOut
        else -> MainUiState.SignedIn(
          if (state.userName.isNotBlank()) state.userName else (user.primaryEmailAddress?.emailAddress ?: ""),
          state.syncState
        )
      }
    }
      .onEach { _uiState.value = it }
      .launchIn(viewModelScope)
  }

  fun refreshSession() {
    viewModelScope.launch { authRepository.syncUser() }
  }

  fun syncQueuedWrites() {
    viewModelScope.launch { apiRepository.syncQueue() }
  }

  fun signOut() {
    viewModelScope.launch {
      Clerk.signOut()
        .onSuccess { authRepository.clearSession() }
        .onFailure { authRepository.reportError("Unable to sign out") }
    }
  }

  private fun enqueueSync() {
    val request = OneTimeWorkRequestBuilder<SyncWorker>()
      .setConstraints(
        Constraints.Builder()
          .setRequiredNetworkType(NetworkType.CONNECTED)
          .build()
      )
      .build()
    WorkManager.getInstance(AppContextHolder.context).enqueue(request)
  }
}

sealed interface MainUiState {
  data object Loading : MainUiState

  data object SignedOut : MainUiState

  data class SignedIn(val userLabel: String, val syncState: SyncState) : MainUiState
}
