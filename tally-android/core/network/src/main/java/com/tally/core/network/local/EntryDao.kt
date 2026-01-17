package com.tally.core.network.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query

@Dao
interface EntryDao {
  @Query("SELECT * FROM entries WHERE challengeId = :challengeId ORDER BY date DESC")
  suspend fun listForChallenge(challengeId: String): List<LocalEntry>

  @Query("SELECT * FROM entries WHERE date = :date ORDER BY createdAt DESC")
  suspend fun listForDate(date: String): List<LocalEntry>

  @Query("SELECT * FROM entries ORDER BY createdAt DESC")
  suspend fun listAll(): List<LocalEntry>

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun upsertAll(entries: List<LocalEntry>)

  @Query("DELETE FROM entries WHERE id = :id")
  suspend fun delete(id: String)
}
