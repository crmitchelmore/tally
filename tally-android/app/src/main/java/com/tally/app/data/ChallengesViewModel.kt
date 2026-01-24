package com.tally.app.data

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.tally.core.network.Challenge
import com.tally.core.network.Feeling
import com.tally.core.network.TimeframeType
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.time.LocalDate

/**
 * ViewModel for managing challenges and entries.
 */
class ChallengesViewModel(
    private val repository: ChallengesRepository
) : ViewModel() {

    // Expose repository flows
    val challenges: StateFlow<List<Challenge>> = repository.challenges
    val isLoading: StateFlow<Boolean> = repository.isLoading
    val error: StateFlow<String?> = repository.error

    // Selected challenge for detail view
    private val _selectedChallenge = MutableStateFlow<Challenge?>(null)
    val selectedChallenge: StateFlow<Challenge?> = _selectedChallenge.asStateFlow()

    // UI state for dialogs
    private val _showCreateDialog = MutableStateFlow(false)
    val showCreateDialog: StateFlow<Boolean> = _showCreateDialog.asStateFlow()

    private val _showEntryDialog = MutableStateFlow<Challenge?>(null)
    val showEntryDialog: StateFlow<Challenge?> = _showEntryDialog.asStateFlow()

    // Combine challenges with their total counts
    val challengesWithCounts = combine(
        repository.challenges,
        repository.entries
    ) { challenges, _ ->
        challenges.map { challenge ->
            ChallengeWithCount(
                challenge = challenge,
                totalCount = repository.getTotalCount(challenge.id)
            )
        }
    }.stateIn(
        viewModelScope,
        SharingStarted.WhileSubscribed(5000),
        emptyList()
    )

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            repository.refresh()
        }
    }

    fun showCreateDialog() {
        _showCreateDialog.value = true
    }

    fun hideCreateDialog() {
        _showCreateDialog.value = false
    }

    fun showEntryDialog(challenge: Challenge) {
        _showEntryDialog.value = challenge
    }

    fun hideEntryDialog() {
        _showEntryDialog.value = null
    }

    fun selectChallenge(challenge: Challenge?) {
        _selectedChallenge.value = challenge
    }

    fun createChallenge(
        name: String,
        target: Int,
        timeframeType: TimeframeType
    ) {
        viewModelScope.launch {
            val challenge = repository.createChallenge(
                name = name,
                target = target,
                timeframeType = timeframeType
            )
            if (challenge != null) {
                hideCreateDialog()
            }
        }
    }

    fun addEntry(
        challenge: Challenge,
        count: Int,
        date: LocalDate = LocalDate.now(),
        note: String? = null,
        feeling: Feeling? = null
    ) {
        viewModelScope.launch {
            val entry = repository.addEntry(
                challengeId = challenge.id,
                count = count,
                date = date,
                note = note,
                feeling = feeling
            )
            if (entry != null) {
                hideEntryDialog()
            }
        }
    }

    fun deleteChallenge(challenge: Challenge) {
        viewModelScope.launch {
            repository.deleteChallenge(challenge.id)
            _selectedChallenge.value = null
        }
    }

    fun clearError() {
        repository.clearError()
    }

    /**
     * Factory for creating ChallengesViewModel with dependencies.
     */
    class Factory(
        private val repository: ChallengesRepository
    ) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(ChallengesViewModel::class.java)) {
                return ChallengesViewModel(repository) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class")
        }
    }
}

/**
 * Challenge with computed total count.
 */
data class ChallengeWithCount(
    val challenge: Challenge,
    val totalCount: Int
) {
    val progress: Float
        get() = if (challenge.target > 0) {
            (totalCount.toFloat() / challenge.target).coerceIn(0f, 1f)
        } else 0f
}
