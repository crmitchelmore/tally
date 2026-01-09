package app.tally

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import app.tally.auth.AuthTokenStore
import app.tally.model.Challenge
import app.tally.model.Entry
import app.tally.net.CreateChallengeRequest
import app.tally.net.CreateEntryRequest
import app.tally.net.TallyApi
import com.clerk.api.Clerk
import com.clerk.api.network.serialization.onFailure
import com.clerk.api.network.serialization.onSuccess
import com.clerk.api.session.SessionGetTokenOptions
import java.time.LocalDate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class TallyUiState(
  val challenges: List<Challenge> = emptyList(),
  val selectedChallengeId: String? = null,
  val entries: List<Entry> = emptyList(),
  val isLoading: Boolean = false,
  val status: String? = null,
  val error: String? = null,
  val showCreateChallenge: Boolean = false,
  val showAddEntry: Boolean = false,
)

class TallyViewModel(application: Application) : AndroidViewModel(application) {
  private val tokenStore = AuthTokenStore(application)

  private val _uiState = MutableStateFlow(TallyUiState())
  val uiState = _uiState.asStateFlow()

  fun onSignedIn() {
    refresh()
  }

  fun onSignedOut() {
    viewModelScope.launch {
      withContext(Dispatchers.IO) { tokenStore.setConvexJwt(null) }
      _uiState.value = TallyUiState()
    }
  }

  fun refresh() {
    viewModelScope.launch {
      _uiState.value = _uiState.value.copy(isLoading = true, error = null)

      try {
        val jwt = getJwtOrFetch() ?: run {
          _uiState.value = _uiState.value.copy(isLoading = false, error = "No auth token")
          return@launch
        }

        val challenges = withContext(Dispatchers.IO) {
          TallyApi.ensureUser(jwt)
          TallyApi.getChallenges(jwt)
        }

        val selectedId = _uiState.value.selectedChallengeId
        val entries = if (selectedId == null) {
          emptyList()
        } else {
          withContext(Dispatchers.IO) { TallyApi.getEntries(jwt, selectedId) }
        }

        _uiState.value = _uiState.value.copy(challenges = challenges, entries = entries, isLoading = false)
      } catch (e: Exception) {
        _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
      }
    }
  }

  fun selectChallenge(id: String) {
    _uiState.value = _uiState.value.copy(selectedChallengeId = id, entries = emptyList(), error = null)
    refresh()
  }

  fun backToList() {
    _uiState.value = _uiState.value.copy(selectedChallengeId = null, entries = emptyList(), error = null)
  }

  fun showCreateChallenge(show: Boolean) {
    _uiState.value = _uiState.value.copy(showCreateChallenge = show)
  }

  fun showAddEntry(show: Boolean) {
    _uiState.value = _uiState.value.copy(showAddEntry = show)
  }

  fun createChallenge(
    name: String,
    targetNumber: Double,
    year: Double,
    color: String = "blue",
    icon: String = "🔥",
    timeframeUnit: String = "year",
    isPublic: Boolean = false,
  ) {
    viewModelScope.launch {
      _uiState.value = _uiState.value.copy(isLoading = true, status = null, error = null, showCreateChallenge = false)

      try {
        val jwt = getJwtOrFetch() ?: run {
          _uiState.value = _uiState.value.copy(isLoading = false, error = "No auth token")
          return@launch
        }

        val id = withContext(Dispatchers.IO) {
          TallyApi.createChallenge(
            jwt,
            CreateChallengeRequest(
              name = name,
              targetNumber = targetNumber,
              year = year,
              color = color,
              icon = icon,
              timeframeUnit = timeframeUnit,
              isPublic = isPublic,
            ),
          )
        }

        _uiState.value = _uiState.value.copy(status = "Created challenge: $id")
        refresh()
      } catch (e: Exception) {
        _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
      }
    }
  }

  fun addEntry(date: String = LocalDate.now().toString(), count: Double) {
    val challengeId = _uiState.value.selectedChallengeId ?: return

    viewModelScope.launch {
      _uiState.value = _uiState.value.copy(isLoading = true, status = null, error = null, showAddEntry = false)

      try {
        val jwt = getJwtOrFetch() ?: run {
          _uiState.value = _uiState.value.copy(isLoading = false, error = "No auth token")
          return@launch
        }

        val id = withContext(Dispatchers.IO) {
          TallyApi.createEntry(jwt, CreateEntryRequest(challengeId = challengeId, date = date, count = count))
        }

        _uiState.value = _uiState.value.copy(status = "Added entry: $id")
        refresh()
      } catch (e: Exception) {
        _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
      }
    }
  }

  fun deleteEntry(entryId: String) {
    viewModelScope.launch {
      _uiState.value = _uiState.value.copy(isLoading = true, status = null, error = null)

      try {
        val jwt = getJwtOrFetch() ?: run {
          _uiState.value = _uiState.value.copy(isLoading = false, error = "No auth token")
          return@launch
        }

        withContext(Dispatchers.IO) { TallyApi.deleteEntry(jwt, entryId) }
        _uiState.value = _uiState.value.copy(status = "Deleted entry")
        refresh()
      } catch (e: Exception) {
        _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
      }
    }
  }

  private suspend fun getJwtOrFetch(): String? {
    val session = Clerk.session
    if (session != null) {
      var jwt: String? = null
      session.fetchToken(SessionGetTokenOptions(template = "convex"))
        .onSuccess { jwt = it.jwt }
        .onFailure { /* ignore */ }

      if (!jwt.isNullOrBlank()) {
        withContext(Dispatchers.IO) { tokenStore.setConvexJwt(jwt) }
        return jwt
      }
    }

    return withContext(Dispatchers.IO) { tokenStore.getConvexJwt()?.takeIf { it.isNotBlank() } }
  }
}
