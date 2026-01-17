package com.tally.core.network.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "challenges")
data class LocalChallenge(
  @PrimaryKey val id: String,
  val name: String,
  val targetNumber: Int,
  val color: String,
  val icon: String,
  val timeframeUnit: String,
  val startDate: String?,
  val endDate: String?,
  val year: Int,
  val isPublic: Boolean,
  val archived: Boolean,
)
