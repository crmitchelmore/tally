package com.tallytracker.domain.model

data class Challenge(
    val id: String,
    val name: String,
    val target: Int,
    val color: String,
    val icon: String,
    val unit: String,
    val year: Int,
    val isPublic: Boolean,
    val archived: Boolean,
    val currentCount: Int,
    val ownerName: String? = null
)
