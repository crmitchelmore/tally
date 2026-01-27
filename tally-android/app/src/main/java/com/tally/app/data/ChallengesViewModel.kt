package com.tally.app.data

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.tally.core.network.Challenge
import com.tally.core.network.ChallengeStats
import com.tally.core.network.ChallengeWithStatsWrapper
import com.tally.core.network.CountType
import com.tally.core.network.DashboardConfig
import com.tally.core.network.DashboardStats
import com.tally.core.network.ExportData
import com.tally.core.network.Feeling
import com.tally.core.network.PersonalRecords
import com.tally.core.network.PublicChallenge
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
    val challengesWithStats: StateFlow<List<ChallengeWithStatsWrapper>> = repository.challengesWithStats
    val dashboardStats: StateFlow<DashboardStats?> = repository.dashboardStats
    val personalRecords: StateFlow<PersonalRecords?> = repository.personalRecords
    val dashboardConfig: StateFlow<DashboardConfig> = repository.dashboardConfig
    val isLoading: StateFlow<Boolean> = repository.isLoading
    val error: StateFlow<String?> = repository.error

    // Community
    val publicChallenges: StateFlow<List<PublicChallenge>> = repository.publicChallenges
    val followingChallenges: StateFlow<List<PublicChallenge>> = repository.followingChallenges

    // Selected challenge for detail view
    private val _selectedChallenge = MutableStateFlow<Challenge?>(null)
    val selectedChallenge: StateFlow<Challenge?> = _selectedChallenge.asStateFlow()

    // UI state for dialogs
    private val _showCreateDialog = MutableStateFlow(false)
    val showCreateDialog: StateFlow<Boolean> = _showCreateDialog.asStateFlow()

    private val _showEntryDialog = MutableStateFlow<Challenge?>(null)
    val showEntryDialog: StateFlow<Challenge?> = _showEntryDialog.asStateFlow()

    // Combine challenges with their total counts (fallback if stats not loaded)
    val challengesWithCounts = combine(
        repository.challenges,
        repository.challengesWithStats,
        repository.entries
    ) { challenges, withStats, _ ->
        if (withStats.isNotEmpty()) {
            withStats.map { wrapper ->
                ChallengeWithCount(
                    challenge = wrapper.challenge,
                    totalCount = wrapper.stats.totalCount,
                    stats = wrapper.stats
                )
            }
        } else {
            challenges.map { challenge ->
                ChallengeWithCount(
                    challenge = challenge,
                    totalCount = repository.getTotalCount(challenge.id),
                    stats = null
                )
            }
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

    fun refreshCommunity(search: String? = null) {
        viewModelScope.launch {
            repository.refreshCommunity(search)
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
        timeframeType: TimeframeType,
        periodOffset: Int = 0,
        countType: CountType = CountType.SIMPLE,
        unitLabel: String? = null,
        defaultIncrement: Int? = null,
        isPublic: Boolean = false,
        color: String = "#4F46E5",
        icon: String = "star"
    ) {
        viewModelScope.launch {
            val challenge = repository.createChallenge(
                name = name,
                target = target,
                timeframeType = timeframeType,
                periodOffset = periodOffset,
                color = color,
                icon = icon,
                isPublic = isPublic,
                countType = countType,
                unitLabel = unitLabel,
                defaultIncrement = defaultIncrement
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
        sets: List<Int>? = null,
        note: String? = null,
        feeling: Feeling? = null
    ) {
        viewModelScope.launch {
            val entry = repository.addEntry(
                challengeId = challenge.id,
                count = count,
                date = date,
                sets = sets,
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

    fun followChallenge(challengeId: String) {
        viewModelScope.launch {
            repository.followChallenge(challengeId)
        }
    }

    fun unfollowChallenge(challengeId: String) {
        viewModelScope.launch {
            repository.unfollowChallenge(challengeId)
        }
    }

    fun exportData(onResult: (ExportData?) -> Unit) {
        viewModelScope.launch {
            val data = repository.exportData()
            onResult(data)
        }
    }

    fun importData(data: ExportData, onResult: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = repository.importData(data)
            onResult(success)
        }
    }

    fun deleteAllData(onResult: (Boolean) -> Unit) {
        viewModelScope.launch {
            val success = repository.deleteAllData()
            onResult(success)
        }
    }

    fun updateDashboardConfig(config: DashboardConfig) {
        repository.updateDashboardConfig(config)
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
 * Challenge with computed total count and optional stats.
 */
data class ChallengeWithCount(
    val challenge: Challenge,
    val totalCount: Int,
    val stats: ChallengeStats? = null
) {
    val progress: Float
        get() = if (challenge.target > 0) {
            (totalCount.toFloat() / challenge.target).coerceIn(0f, 1f)
        } else 0f
}
