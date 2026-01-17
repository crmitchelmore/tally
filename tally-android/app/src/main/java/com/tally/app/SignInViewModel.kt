package com.tally.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.clerk.api.signin.SignIn
import com.clerk.api.network.serialization.onFailure
import com.clerk.api.network.serialization.onSuccess
import com.clerk.api.network.serialization.errorMessage
import com.tally.core.auth.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SignInViewModel : ViewModel() {
  private val authRepository = AuthRepository()
  private val _uiState = MutableStateFlow(SignInUiState())
  val uiState = _uiState.asStateFlow()

  fun updateEmail(value: String) {
    _uiState.value = _uiState.value.copy(email = value)
  }

  fun updatePassword(value: String) {
    _uiState.value = _uiState.value.copy(password = value)
  }

  fun signIn(onSignedIn: () -> Unit) {
    val email = _uiState.value.email
    val password = _uiState.value.password
    if (email.isBlank() || password.isBlank()) {
      _uiState.value = _uiState.value.copy(error = "Enter email and password.")
      return
    }
    viewModelScope.launch {
      _uiState.value = _uiState.value.copy(isLoading = true, error = null)
      SignIn.create(SignIn.CreateParams.Strategy.Password(identifier = email, password = password))
        .onSuccess {
          authRepository.syncUser(onSignedIn)
        }
        .onFailure {
          _uiState.value = _uiState.value.copy(isLoading = false, error = it.errorMessage)
        }
    }
  }
}

data class SignInUiState(
  val email: String = "",
  val password: String = "",
  val isLoading: Boolean = false,
  val error: String? = null
)
