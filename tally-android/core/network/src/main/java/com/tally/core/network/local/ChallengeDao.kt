package com.tally.core.network.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface ChallengeDao {
  @Query("SELECT * FROM challenges WHERE archived = 0 ORDER BY year DESC")
  suspend fun listActive(): List<LocalChallenge>

  @Query("SELECT * FROM challenges WHERE archived = 1 ORDER BY year DESC")
  suspend fun listArchived(): List<LocalChallenge>

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun upsertAll(challenges: List<LocalChallenge>)

  @Query("DELETE FROM challenges WHERE id = :id")
  suspend fun delete(id: String)

  @Query("SELECT * FROM challenges WHERE id = :id LIMIT 1")
  suspend fun findById(id: String): LocalChallenge?
}
