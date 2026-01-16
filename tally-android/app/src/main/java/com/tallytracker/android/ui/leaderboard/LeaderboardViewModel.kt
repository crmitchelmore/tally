package com.tallytracker.android.ui.leaderboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tallytracker.domain.repository.LeaderboardRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LeaderboardEntryUiModel(
    val id: String,
    val name: String,
    val total: Int
)

data class LeaderboardUiState(
    val entries: List<LeaderboardEntryUiModel> = emptyList(),
    val timeRange: String = "month",
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class LeaderboardViewModel @Inject constructor(
    private val repository: LeaderboardRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(LeaderboardUiState(isLoading = true))
    val uiState: StateFlow<LeaderboardUiState> = _uiState.asStateFlow()
    
    init {
        loadLeaderboard()
    }
    
    fun setTimeRange(timeRange: String) {
        _uiState.update { it.copy(timeRange = timeRange) }
        loadLeaderboard()
    }
    
    fun loadLeaderboard() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val entries = repository.getLeaderboard(_uiState.value.timeRange)
                _uiState.update {
                    it.copy(
                        entries = entries.map { e ->
                            LeaderboardEntryUiModel(
                                id = e.id,
                                name = e.name ?: "Anonymous",
                                total = e.total
                            )
                        },
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message, isLoading = false) }
            }
        }
    }
}
