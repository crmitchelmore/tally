package com.tallytracker.domain.model

data class LeaderboardEntry(
    val id: String,
    val name: String?,
    val avatarUrl: String?,
    val total: Int,
    val rank: Int
)
