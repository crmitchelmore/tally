package com.tally.core.network.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface QueueDao {
  @Query("SELECT * FROM sync_queue ORDER BY createdAt ASC")
  suspend fun listAll(): List<QueueItem>

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun insert(item: QueueItem)

  @Query("DELETE FROM sync_queue WHERE id = :id")
  suspend fun delete(id: String)

  @Query("UPDATE sync_queue SET attempts = attempts + 1 WHERE id = :id")
  suspend fun incrementAttempts(id: String)
}
