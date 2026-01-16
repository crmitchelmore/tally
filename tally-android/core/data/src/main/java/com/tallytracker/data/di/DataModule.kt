package com.tallytracker.data.di

import com.tallytracker.data.repository.AuthRepositoryImpl
import com.tallytracker.data.repository.ChallengesRepositoryImpl
import com.tallytracker.data.repository.CommunityRepositoryImpl
import com.tallytracker.data.repository.LeaderboardRepositoryImpl
import com.tallytracker.domain.repository.AuthRepository
import com.tallytracker.domain.repository.ChallengesRepository
import com.tallytracker.domain.repository.CommunityRepository
import com.tallytracker.domain.repository.LeaderboardRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class DataModule {
    
    @Binds
    @Singleton
    abstract fun bindChallengesRepository(impl: ChallengesRepositoryImpl): ChallengesRepository
    
    @Binds
    @Singleton
    abstract fun bindCommunityRepository(impl: CommunityRepositoryImpl): CommunityRepository
    
    @Binds
    @Singleton
    abstract fun bindLeaderboardRepository(impl: LeaderboardRepositoryImpl): LeaderboardRepository
    
    @Binds
    @Singleton
    abstract fun bindAuthRepository(impl: AuthRepositoryImpl): AuthRepository
}
