package com.tally.core.network.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface FollowedDao {
  @Query("SELECT * FROM followed ORDER BY followedAt DESC")
  suspend fun listAll(): List<LocalFollowed>

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun upsertAll(followed: List<LocalFollowed>)

  @Query("DELETE FROM followed WHERE id = :id")
  suspend fun delete(id: String)
}
