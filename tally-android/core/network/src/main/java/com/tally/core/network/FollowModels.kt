package com.tally.core.network

import kotlinx.serialization.Serializable

@Serializable
data class Followed(
  val id: String,
  val challengeId: String,
  val followedAt: String,
)

@Serializable
data class FollowedPayload(
  val challengeId: String,
)

@Serializable
data class DeletedResponse(
  val id: String,
)

@Serializable
data class PublicChallenge(
  val id: String,
  val name: String,
  val targetNumber: Int,
  val color: String,
  val icon: String,
  val timeframeUnit: TimeframeUnit,
  val startDate: String? = null,
  val endDate: String? = null,
  val year: Int,
  val isPublic: Boolean,
  val archived: Boolean,
  val totalReps: Int,
  val progress: Double,
  val followerCount: Int,
  val ownerName: String,
  val ownerAvatarUrl: String? = null,
)
