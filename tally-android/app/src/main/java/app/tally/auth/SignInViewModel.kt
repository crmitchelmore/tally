package app.tally.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.clerk.api.network.serialization.errorMessage
import com.clerk.api.network.serialization.onFailure
import com.clerk.api.network.serialization.onSuccess
import com.clerk.api.signin.SignIn
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SignInViewModel : ViewModel() {
  private val _uiState = MutableStateFlow<SignInUiState>(SignInUiState.Idle)
  val uiState = _uiState.asStateFlow()

  fun signIn(email: String, password: String) {
    _uiState.value = SignInUiState.Loading

    viewModelScope.launch {
      SignIn.create(SignIn.CreateParams.Strategy.Password(identifier = email, password = password))
        .onSuccess { _uiState.value = SignInUiState.Success }
        .onFailure { _uiState.value = SignInUiState.Error(it.errorMessage) }
    }
  }

  sealed interface SignInUiState {
    data object Idle : SignInUiState
    data object Loading : SignInUiState
    data object Success : SignInUiState
    data class Error(val message: String) : SignInUiState
  }
}
