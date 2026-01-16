package com.tallytracker.android.ui.challenges

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tallytracker.domain.model.Challenge
import com.tallytracker.domain.repository.ChallengesRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import javax.inject.Inject

data class ChallengeUiModel(
    val id: String,
    val name: String,
    val icon: String,
    val current: Int,
    val target: Int,
    val progress: Float,
    val daysLeft: Int,
    val paceStatus: String
)

data class ChallengesUiState(
    val challenges: List<ChallengeUiModel> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ChallengesViewModel @Inject constructor(
    private val repository: ChallengesRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ChallengesUiState(isLoading = true))
    val uiState: StateFlow<ChallengesUiState> = _uiState.asStateFlow()
    
    init {
        loadChallenges()
    }
    
    fun loadChallenges() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                repository.getChallenges().collect { challenges ->
                    _uiState.update { 
                        it.copy(
                            challenges = challenges.map { c -> c.toUiModel() },
                            isLoading = false
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(error = e.message ?: "Failed to load challenges", isLoading = false) 
                }
            }
        }
    }
    
    fun createChallenge(name: String, target: Int) {
        viewModelScope.launch {
            try {
                repository.createChallenge(
                    name = name,
                    target = target,
                    color = "#6750A4",
                    icon = "✅",
                    unit = "year",
                    isPublic = false
                )
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }
    
    fun addEntry(challengeId: String) {
        viewModelScope.launch {
            try {
                repository.createEntry(challengeId, 1, null)
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }
    
    private fun Challenge.toUiModel(): ChallengeUiModel {
        val today = LocalDate.now()
        val endOfYear = LocalDate.of(today.year, 12, 31)
        val daysLeft = ChronoUnit.DAYS.between(today, endOfYear).toInt().coerceAtLeast(0)
        val daysPassed = today.dayOfYear
        val expectedProgress = (daysPassed.toFloat() / 365f) * target
        
        val paceStatus = when {
            currentCount > expectedProgress + 1 -> "Ahead"
            currentCount < expectedProgress - 1 -> "Behind"
            else -> "On pace"
        }
        
        return ChallengeUiModel(
            id = id,
            name = name,
            icon = icon,
            current = currentCount,
            target = target,
            progress = currentCount.toFloat() / target,
            daysLeft = daysLeft,
            paceStatus = paceStatus
        )
    }
}
