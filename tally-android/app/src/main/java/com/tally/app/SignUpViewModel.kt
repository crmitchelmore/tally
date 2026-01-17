package com.tally.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.clerk.api.Clerk
import com.clerk.api.network.serialization.errorMessage
import com.clerk.api.network.serialization.onFailure
import com.clerk.api.network.serialization.onSuccess
import com.clerk.api.signup.SignUp
import com.clerk.api.signup.attemptVerification
import com.clerk.api.signup.prepareVerification
import com.tally.core.auth.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SignUpViewModel : ViewModel() {
  private val authRepository = AuthRepository()
  private val _uiState = MutableStateFlow(SignUpUiState())
  val uiState = _uiState.asStateFlow()

  fun updateEmail(value: String) {
    _uiState.value = _uiState.value.copy(email = value)
  }

  fun updatePassword(value: String) {
    _uiState.value = _uiState.value.copy(password = value)
  }

  fun signUp() {
    val email = _uiState.value.email
    val password = _uiState.value.password
    if (email.isBlank() || password.isBlank()) {
      _uiState.value = _uiState.value.copy(error = "Enter email and password.")
      return
    }
    viewModelScope.launch {
      _uiState.value = _uiState.value.copy(isLoading = true, error = null)
      SignUp.create(SignUp.CreateParams.Standard(emailAddress = email, password = password))
        .onSuccess {
          if (it.status == SignUp.Status.COMPLETE) {
            authRepository.syncUser()
          } else {
            _uiState.value = _uiState.value.copy(
              isLoading = false,
              needsVerification = true,
              error = null
            )
            it.prepareVerification(SignUp.PrepareVerificationParams.Strategy.EmailCode())
          }
        }
        .onFailure {
          _uiState.value = _uiState.value.copy(isLoading = false, error = it.errorMessage)
        }
    }
  }

  fun verify(code: String, onSignedIn: () -> Unit) {
    val signUp = Clerk.signUp ?: return
    viewModelScope.launch {
      _uiState.value = _uiState.value.copy(isLoading = true, error = null)
      signUp.attemptVerification(SignUp.AttemptVerificationParams.EmailCode(code))
        .onSuccess { authRepository.syncUser(onSignedIn) }
        .onFailure { _uiState.value = _uiState.value.copy(isLoading = false, error = it.errorMessage) }
    }
  }
}

data class SignUpUiState(
  val email: String = "",
  val password: String = "",
  val isLoading: Boolean = false,
  val needsVerification: Boolean = false,
  val error: String? = null
)
