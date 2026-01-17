package com.tally.core.network.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "entries")
data class LocalEntry(
  @PrimaryKey val id: String,
  val challengeId: String,
  val date: String,
  val count: Int,
  val note: String?,
  val feeling: String?,
  val setsJson: String?,
  val createdAt: String,
)
