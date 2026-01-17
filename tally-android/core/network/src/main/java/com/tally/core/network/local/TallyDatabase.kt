package com.tally.core.network.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
  entities = [LocalChallenge::class, LocalEntry::class, LocalFollowed::class, QueueItem::class],
  version = 1,
  exportSchema = false
)
abstract class TallyDatabase : RoomDatabase() {
  abstract fun challenges(): ChallengeDao
  abstract fun entries(): EntryDao
  abstract fun followed(): FollowedDao
  abstract fun queue(): QueueDao

  companion object {
    @Volatile private var instance: TallyDatabase? = null

    fun get(context: Context): TallyDatabase {
      return instance ?: synchronized(this) {
        instance ?: Room.databaseBuilder(context, TallyDatabase::class.java, "tally.db").build()
          .also { instance = it }
      }
    }
  }
}
