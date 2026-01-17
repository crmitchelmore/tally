package com.tally.core.network.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "followed")
data class LocalFollowed(
  @PrimaryKey val id: String,
  val challengeId: String,
  val followedAt: String,
)
