package com.tally.core.network.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "sync_queue")
data class QueueItem(
  @PrimaryKey val id: String,
  val type: String,
  val method: String,
  val payloadJson: String,
  val createdAt: String,
  val attempts: Int,
)
