package com.tallytracker.data.repository

import com.tallytracker.data.api.TallyApiClient
import com.tallytracker.domain.model.User
import com.tallytracker.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val apiClient: TallyApiClient
) : AuthRepository {
    
    private val _currentUser = MutableStateFlow<User?>(null)
    
    override fun getCurrentUser(): Flow<User?> = _currentUser
    
    override suspend fun signIn(email: String, password: String) {
        // Mock auth - in production would use Clerk
        val userId = "user_${UUID.randomUUID().toString().take(8)}"
        _currentUser.value = User(
            id = userId,
            email = email,
            name = email.substringBefore("@"),
            avatarUrl = null
        )
        apiClient.setAuthToken(userId)
    }
    
    override suspend fun signUp(email: String, password: String, name: String?) {
        val userId = "user_${UUID.randomUUID().toString().take(8)}"
        _currentUser.value = User(
            id = userId,
            email = email,
            name = name ?: email.substringBefore("@"),
            avatarUrl = null
        )
        apiClient.setAuthToken(userId)
    }
    
    override suspend fun signOut() {
        _currentUser.value = null
        apiClient.setAuthToken(null)
    }
}
