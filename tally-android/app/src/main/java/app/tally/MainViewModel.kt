package app.tally

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.clerk.api.Clerk
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch

class MainViewModel : ViewModel() {
  private val _uiState = MutableStateFlow<MainUiState>(
    if (BuildConfig.CLERK_PUBLISHABLE_KEY.isBlank()) MainUiState.MissingConfig else MainUiState.Loading
  )
  val uiState = _uiState.asStateFlow()

  init {
    if (BuildConfig.CLERK_PUBLISHABLE_KEY.isBlank()) return

    combine(Clerk.isInitialized, Clerk.userFlow) { isInitialized, user ->
      when {
        !isInitialized -> MainUiState.Loading
        user != null -> MainUiState.SignedIn
        else -> MainUiState.SignedOut
      }
    }
      .onEach { _uiState.value = it }
      .launchIn(viewModelScope)
  }

  fun signOut() {
    viewModelScope.launch { Clerk.signOut() }
  }
}

sealed interface MainUiState {
  data object MissingConfig : MainUiState
  data object Loading : MainUiState
  data object SignedIn : MainUiState
  data object SignedOut : MainUiState
}
