package app.tally

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import app.tally.auth.AuthTokenStore
import app.tally.model.Challenge
import app.tally.model.Entry
import app.tally.model.LeaderboardRow
import app.tally.net.CreateChallengeRequest
import app.tally.net.CreateEntryRequest
import app.tally.net.UpdateChallengeRequest
import app.tally.net.UpdateEntryRequest
import app.tally.net.TallyApi

import java.time.LocalDate
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

data class TallyUiState(
  val challenges: List<Challenge> = emptyList(),
  val publicChallenges: List<Challenge> = emptyList(),
  val leaderboard: List<LeaderboardRow> = emptyList(),
  val followedChallengeIds: Set<String> = emptySet(),
  val selectedChallengeId: String? = null,
  val entries: List<Entry> = emptyList(),
  val selectedEntry: Entry? = null,
  val isLoading: Boolean = false,
  val status: String? = null,
  val error: String? = null,
  val showCreateChallenge: Boolean = false,
  val showAddEntry: Boolean = false,
  val showEditEntry: Boolean = false,
  val showChallengeSettings: Boolean = false,
  val currentTab: Int = 0,
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

  fun setTab(tab: Int) {
    _uiState.value = _uiState.value.copy(currentTab = tab)
    when (tab) {
      1 -> loadLeaderboard()
      2 -> loadCommunity()
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

  fun loadLeaderboard() {
    viewModelScope.launch {
      _uiState.value = _uiState.value.copy(isLoading = true, error = null)

      try {
        val leaderboard = withContext(Dispatchers.IO) { TallyApi.getLeaderboard() }
        _uiState.value = _uiState.value.copy(leaderboard = leaderboard, isLoading = false)
      } catch (e: Exception) {
        _uiState.value = _uiState.value.copy(isLoading = false, error = e.message)
      }
    }
  }

  fun loadCommunity() {
    viewModelScope.launch {
      _uiState.value = _uiState.value.copy(isLoading = true, error = null)

      try {
        val publicChallenges = withContext(Dispatchers.IO) { TallyApi.getPublicChallenges() }
        
        val jwt = getJwtOrFetch()
        val followedIds = if (jwt != null) {
          withContext(Dispatchers.IO) { 
            TallyApi.getFollowed(jwt).map { it.challengeId }.toSet()
          }
        } else {
          emptySet()
        }

        _uiState.value = _uiState.value.copy(
          publicChallenges = publicChallenges,
          followedChallengeIds = followedIds,
          isLoading = false
        )
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

  fun showEditEntry(entry: Entry?) {
    _uiState.value = _uiState.value.copy(showEditEntry = entry != null, selectedEntry = entry)
  }

  fun showChallengeSettings(show: Boolean) {
    _uiState.value = _uiState.value.copy(showChallengeSettings = show)
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

  fun updateChallenge(challengeId: String, isPublic: Boolean? = null, archived: Boolean? = null) {
    viewModelScope.launch {
      _uiState.value = _uiState.value.copy(isLoading = true, status = null, error = null, showChallengeSettings = false)

      try {
        val jwt = getJwtOrFetch() ?: run {
          _uiState.value = _uiState.value.copy(isLoading = false, error = "No auth token")
          return@launch
        }

        withContext(Dispatchers.IO) {
          TallyApi.updateChallenge(jwt, challengeId, UpdateChallengeRequest(isPublic = isPublic, archived = archived))
        }

        _uiState.value = _uiState.value.copy(status = "Challenge updated")
        if (archived == true) {
          backToList()
        }
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

  fun updateEntry(entryId: String, count: Double?, note: String?) {
    viewModelScope.launch {
      _uiState.value = _uiState.value.copy(isLoading = true, status = null, error = null, showEditEntry = false, selectedEntry = null)

      try {
        val jwt = getJwtOrFetch() ?: run {
          _uiState.value = _uiState.value.copy(isLoading = false, error = "No auth token")
          return@launch
        }

        withContext(Dispatchers.IO) {
          TallyApi.updateEntry(jwt, entryId, UpdateEntryRequest(count = count, note = note))
        }

        _uiState.value = _uiState.value.copy(status = "Entry updated")
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

  fun toggleFollow(challengeId: String) {
    viewModelScope.launch {
      try {
        val jwt = getJwtOrFetch() ?: return@launch
        val isFollowing = _uiState.value.followedChallengeIds.contains(challengeId)

        withContext(Dispatchers.IO) {
          if (isFollowing) {
            TallyApi.unfollow(jwt, challengeId)
          } else {
            TallyApi.follow(jwt, challengeId)
          }
        }

        val newFollowed = if (isFollowing) {
          _uiState.value.followedChallengeIds - challengeId
        } else {
          _uiState.value.followedChallengeIds + challengeId
        }
        
        _uiState.value = _uiState.value.copy(followedChallengeIds = newFollowed)
      } catch (e: Exception) {
        _uiState.value = _uiState.value.copy(error = e.message)
      }
    }
  }

  private suspend fun getJwtOrFetch(): String? {
    // Clerk token integration is still WIP; keep builds green by relying on persisted token only.
    return withContext(Dispatchers.IO) { tokenStore.getConvexJwt()?.takeIf { it.isNotBlank() } }
  }
}
