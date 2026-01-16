package com.tallytracker.domain.model

import java.time.LocalDateTime

data class Entry(
    val id: String,
    val challengeId: String,
    val date: String,
    val count: Int,
    val note: String?,
    val createdAt: LocalDateTime
)
