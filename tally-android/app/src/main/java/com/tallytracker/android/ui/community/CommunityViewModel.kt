package com.tallytracker.android.ui.community

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tallytracker.domain.repository.CommunityRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class PublicChallengeUiModel(
    val id: String,
    val name: String,
    val icon: String,
    val target: Int,
    val progress: Int,
    val ownerName: String
)

data class CommunityUiState(
    val challenges: List<PublicChallengeUiModel> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class CommunityViewModel @Inject constructor(
    private val repository: CommunityRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(CommunityUiState(isLoading = true))
    val uiState: StateFlow<CommunityUiState> = _uiState.asStateFlow()
    
    init {
        loadPublicChallenges()
    }
    
    fun loadPublicChallenges() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                repository.getPublicChallenges().collect { challenges ->
                    _uiState.update {
                        it.copy(
                            challenges = challenges.map { c ->
                                PublicChallengeUiModel(
                                    id = c.id,
                                    name = c.name,
                                    icon = c.icon,
                                    target = c.target,
                                    progress = if (c.target > 0) (c.currentCount * 100 / c.target) else 0,
                                    ownerName = c.ownerName ?: "Anonymous"
                                )
                            },
                            isLoading = false
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message, isLoading = false) }
            }
        }
    }
}
