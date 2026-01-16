package com.tallytracker.domain.repository

import com.tallytracker.domain.model.User
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    fun getCurrentUser(): Flow<User?>
    suspend fun signIn(email: String, password: String)
    suspend fun signUp(email: String, password: String, name: String?)
    suspend fun signOut()
}
