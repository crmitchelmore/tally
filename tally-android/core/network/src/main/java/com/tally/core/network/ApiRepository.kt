package com.tally.core.network

import android.content.Context
import com.tally.core.network.local.LocalChallenge
import com.tally.core.network.local.LocalEntry
import com.tally.core.network.local.LocalFollowed
import com.tally.core.network.local.QueueItem
import com.tally.core.network.local.TallyDatabase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.builtins.MapSerializer
import kotlinx.serialization.builtins.serializer
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.time.Instant
import java.util.UUID

class ApiRepository(
  context: Context,
  private val apiClient: ApiClient,
  private val tokenProvider: () -> String?,
  private val onEnqueue: (() -> Unit)? = null
) {
  private val db = TallyDatabase.get(context)
  private val json = Json { ignoreUnknownKeys = true }
  var onTelemetryEvent: (event: String, properties: Map<String, Any?>) -> Unit = { _, _ -> }

  @Serializable
  private data class QueuedChallengePayload(
    val id: String,
    val payload: ChallengePayload
  )

  @Serializable
  private data class QueuedEntryPayload(
    val id: String,
    val payload: EntryPayload
  )

  suspend fun listChallenges(active: Boolean? = null): Result<List<Challenge>> {
    val token = tokenProvider()
    val local = if (active == true) {
      db.challenges().listActive().map { it.toDomain() }
    } else if (active == false) {
      db.challenges().listArchived().map { it.toDomain() }
    } else {
      db.challenges().listActive().map { it.toDomain() } +
        db.challenges().listArchived().map { it.toDomain() }
    }
    if (token.isNullOrBlank()) {
      return Result.success(local)
    }
    val remote = apiClient.listChallenges(token, active)
    if (remote.isSuccess) {
      val values = remote.getOrNull().orEmpty()
      db.challenges().upsertAll(values.map { it.toLocal() })
      val refreshed = if (active == true) {
        db.challenges().listActive().map { it.toDomain() }
      } else if (active == false) {
        db.challenges().listArchived().map { it.toDomain() }
      } else {
        db.challenges().listActive().map { it.toDomain() } +
          db.challenges().listArchived().map { it.toDomain() }
      }
      return Result.success(refreshed)
    }
    return Result.success(local)
  }

  suspend fun createChallenge(payload: ChallengePayload): Result<Challenge> {
    val token = tokenProvider()
    if (token.isNullOrBlank()) {
      enqueue(
        "challenge",
        "POST",
        json.encodeToString(ChallengePayload.serializer(), payload)
      )
      val fallback = payload.toLocalFallback().toDomain()
      db.challenges().upsertAll(listOf(fallback.toLocal()))
      return Result.success(fallback)
    }
    val result = apiClient.createChallenge(token, payload)
    return if (result.isSuccess) {
      val challenge = result.getOrNull()
      if (challenge != null) {
        db.challenges().upsertAll(listOf(challenge.toLocal()))
        onTelemetryEvent(
          "challenge_created",
          mapOf(
            "challenge_id" to challenge.id,
            "timeframe_unit" to challenge.timeframeUnit.name.lowercase(),
            "target_number" to challenge.targetNumber
          )
        )
        Result.success(challenge)
      } else {
        Result.failure(IllegalStateException("Missing challenge response"))
      }
    } else {
      enqueue(
        "challenge",
        "POST",
        json.encodeToString(ChallengePayload.serializer(), payload)
      )
      Result.success(payload.toLocalFallback().toDomain())
    }
  }

  suspend fun updateChallenge(id: String, payload: ChallengePayload): Result<Challenge> {
    val token = tokenProvider()
    if (token.isNullOrBlank()) {
      enqueue(
        "challenge",
        "PATCH",
        json.encodeToString(QueuedChallengePayload.serializer(), payload.toQueuePayload(id))
      )
      val fallback = payload.toLocalFallback(id).toDomain()
      db.challenges().upsertAll(listOf(fallback.toLocal()))
      return Result.success(fallback)
    }
    val result = apiClient.updateChallenge(token, id, payload)
    return if (result.isSuccess) {
      val challenge = result.getOrNull()
      if (challenge != null) {
        db.challenges().upsertAll(listOf(challenge.toLocal()))
        onTelemetryEvent(
          if (challenge.archived) "challenge_archived" else "challenge_updated",
          mapOf(
            "challenge_id" to challenge.id,
            "timeframe_unit" to challenge.timeframeUnit.name.lowercase(),
            "target_number" to challenge.targetNumber,
            "archived" to challenge.archived
          )
        )
        Result.success(challenge)
      } else {
        Result.failure(IllegalStateException("Missing challenge response"))
      }
    } else {
      enqueue(
        "challenge",
        "PATCH",
        json.encodeToString(QueuedChallengePayload.serializer(), payload.toQueuePayload(id))
      )
      val fallback = payload.toLocalFallback(id).toDomain()
      db.challenges().upsertAll(listOf(fallback.toLocal()))
      Result.success(fallback)
    }
  }

  suspend fun deleteChallenge(id: String): Result<Boolean> {
    val entryCount = db.entries().listForChallenge(id).size
    val challenge = db.challenges().findById(id)
    val token = tokenProvider()
    if (token.isNullOrBlank()) {
      enqueue(
        "challenge",
        "DELETE",
        json.encodeToString(MapSerializer(String.serializer(), String.serializer()), mapOf("id" to id))
      )
      db.challenges().delete(id)
      onTelemetryEvent(
        "challenge_archived",
        mapOf(
          "challenge_id" to id,
          "entry_count" to entryCount,
          "timeframe_unit" to challenge?.timeframeUnit?.lowercase(),
          "target_number" to challenge?.targetNumber,
          "archived" to true
        )
      )
      return Result.success(true)
    }
    val result = apiClient.deleteChallenge(token, id)
    return if (result.isSuccess) {
      db.challenges().delete(id)
      onTelemetryEvent(
        "challenge_archived",
        mapOf(
          "challenge_id" to id,
          "entry_count" to entryCount,
          "timeframe_unit" to challenge?.timeframeUnit?.lowercase(),
          "target_number" to challenge?.targetNumber,
          "archived" to true
        )
      )
      Result.success(true)
    } else {
      enqueue(
        "challenge",
        "DELETE",
        json.encodeToString(MapSerializer(String.serializer(), String.serializer()), mapOf("id" to id))
      )
      onTelemetryEvent(
        "challenge_archived",
        mapOf(
          "challenge_id" to id,
          "entry_count" to entryCount,
          "timeframe_unit" to challenge?.timeframeUnit?.lowercase(),
          "target_number" to challenge?.targetNumber,
          "archived" to true
        )
      )
      Result.success(true)
    }
  }

  suspend fun listEntries(challengeId: String? = null, date: String? = null): Result<List<Entry>> {
    val local = when {
      !challengeId.isNullOrBlank() -> db.entries().listForChallenge(challengeId).map { it.toDomain(json) }
      !date.isNullOrBlank() -> db.entries().listForDate(date).map { it.toDomain(json) }
      else -> db.entries().listAll().map { it.toDomain(json) }
    }
    val token = tokenProvider()
    if (token.isNullOrBlank()) {
      return Result.success(local)
    }
    val remote = apiClient.listEntries(token, challengeId, date)
    if (remote.isSuccess) {
      val values = remote.getOrNull().orEmpty()
      db.entries().upsertAll(values.map { it.toLocal(json) })
      val refreshed = when {
        !challengeId.isNullOrBlank() -> db.entries().listForChallenge(challengeId).map { it.toDomain(json) }
        !date.isNullOrBlank() -> db.entries().listForDate(date).map { it.toDomain(json) }
        else -> db.entries().listAll().map { it.toDomain(json) }
      }
      return Result.success(refreshed)
    }
    return Result.success(local)
  }

  suspend fun createEntry(payload: EntryPayload): Result<Entry> {
    val token = tokenProvider()
    if (token.isNullOrBlank()) {
      enqueue("entry", "POST", json.encodeToString(EntryPayload.serializer(), payload))
      val fallback = payload.toLocalFallback()
      db.entries().upsertAll(listOf(fallback))
      return Result.success(fallback.toDomain(json))
    }
    val result = apiClient.createEntry(token, payload)
    return if (result.isSuccess) {
      val entry = result.getOrNull()
      if (entry != null) {
        db.entries().upsertAll(listOf(entry.toLocal(json)))
        onTelemetryEvent(
          "entry_created",
          mapOf(
            "entry_id" to entry.id,
            "challenge_id" to entry.challengeId,
            "entry_count" to entry.count,
            "has_note" to !entry.note.isNullOrBlank(),
            "has_sets" to !entry.sets.isNullOrEmpty(),
            "feeling" to entry.feeling?.name?.lowercase()
          )
        )
        Result.success(entry)
      } else {
        Result.failure(IllegalStateException("Missing entry response"))
      }
    } else {
      enqueue("entry", "POST", json.encodeToString(EntryPayload.serializer(), payload))
      val fallback = payload.toLocalFallback()
      db.entries().upsertAll(listOf(fallback))
      Result.success(fallback.toDomain(json))
    }
  }

  suspend fun updateEntry(id: String, payload: EntryPayload): Result<Entry> {
    val token = tokenProvider()
    if (token.isNullOrBlank()) {
      enqueue(
        "entry",
        "PATCH",
        json.encodeToString(QueuedEntryPayload.serializer(), payload.toQueuePayload(id))
      )
      val fallback = payload.toLocalFallback(id)
      db.entries().upsertAll(listOf(fallback))
      return Result.success(fallback.toDomain(json))
    }
    val result = apiClient.updateEntry(token, id, payload)
    return if (result.isSuccess) {
      val entry = result.getOrNull()
      if (entry != null) {
        db.entries().upsertAll(listOf(entry.toLocal(json)))
        onTelemetryEvent(
          "entry_updated",
          mapOf(
            "entry_id" to entry.id,
            "challenge_id" to entry.challengeId,
            "entry_count" to entry.count,
            "has_note" to !entry.note.isNullOrBlank(),
            "has_sets" to !entry.sets.isNullOrEmpty(),
            "feeling" to entry.feeling?.name?.lowercase()
          )
        )
        Result.success(entry)
      } else {
        Result.failure(IllegalStateException("Missing entry response"))
      }
    } else {
      enqueue(
        "entry",
        "PATCH",
        json.encodeToString(QueuedEntryPayload.serializer(), payload.toQueuePayload(id))
      )
      val fallback = payload.toLocalFallback(id)
      db.entries().upsertAll(listOf(fallback))
      Result.success(fallback.toDomain(json))
    }
  }

  suspend fun deleteEntry(id: String): Result<Boolean> {
    val existing = db.entries().listAll().firstOrNull { it.id == id }
    val hasNote = existing?.note?.isNotBlank() == true
    val hasSets = existing?.setsJson?.isNotBlank() == true
    val token = tokenProvider()
    if (token.isNullOrBlank()) {
      enqueue(
        "entry",
        "DELETE",
        json.encodeToString(MapSerializer(String.serializer(), String.serializer()), mapOf("id" to id))
      )
      onTelemetryEvent(
        "entry_deleted",
        mapOf(
          "entry_id" to id,
          "challenge_id" to existing?.challengeId,
          "entry_count" to existing?.count,
          "has_note" to hasNote,
          "has_sets" to hasSets
        )
      )
      db.entries().delete(id)
      return Result.success(true)
    }
    val result = apiClient.deleteEntry(token, id)
    return if (result.isSuccess) {
      db.entries().delete(id)
      onTelemetryEvent(
        "entry_deleted",
        mapOf(
          "entry_id" to id,
          "challenge_id" to existing?.challengeId,
          "entry_count" to existing?.count,
          "has_note" to hasNote,
          "has_sets" to hasSets
        )
      )
      Result.success(true)
    } else {
      enqueue(
        "entry",
        "DELETE",
        json.encodeToString(MapSerializer(String.serializer(), String.serializer()), mapOf("id" to id))
      )
      onTelemetryEvent(
        "entry_deleted",
        mapOf(
          "entry_id" to id,
          "challenge_id" to existing?.challengeId,
          "entry_count" to existing?.count,
          "has_note" to hasNote,
          "has_sets" to hasSets
        )
      )
      Result.success(true)
    }
  }

  suspend fun listFollowed(): Result<List<Followed>> {
    val local = db.followed().listAll().map { it.toDomain() }
    val token = tokenProvider()
    if (token.isNullOrBlank()) {
      return Result.success(local)
    }
    val remote = apiClient.listFollowed(token)
    if (remote.isSuccess) {
      val values = remote.getOrNull().orEmpty()
      db.followed().upsertAll(values.map { it.toLocal() })
      return Result.success(db.followed().listAll().map { it.toDomain() })
    }
    return Result.success(local)
  }

  suspend fun followChallenge(challengeId: String): Result<Followed> {
    val token = tokenProvider()
    if (token.isNullOrBlank()) {
      enqueue(
        "followed",
        "POST",
        json.encodeToString(FollowedPayload.serializer(), FollowedPayload(challengeId))
      )
      val fallback = Followed(
        id = "local_${UUID.randomUUID()}",
        challengeId = challengeId,
        followedAt = Instant.now().toString()
      )
      db.followed().upsertAll(listOf(fallback.toLocal()))
      return Result.success(fallback)
    }
    val result = apiClient.followChallenge(token, challengeId)
    return if (result.isSuccess) {
      val followed = result.getOrNull()
      if (followed != null) {
        db.followed().upsertAll(listOf(followed.toLocal()))
        Result.success(followed)
      } else {
        Result.failure(IllegalStateException("Missing follow response"))
      }
    } else {
      enqueue(
        "followed",
        "POST",
        json.encodeToString(FollowedPayload.serializer(), FollowedPayload(challengeId))
      )
      val fallback = Followed(
        id = "local_${UUID.randomUUID()}",
        challengeId = challengeId,
        followedAt = Instant.now().toString()
      )
      db.followed().upsertAll(listOf(fallback.toLocal()))
      Result.success(fallback)
    }
  }

  suspend fun unfollowChallenge(followedId: String): Result<Boolean> {
    val token = tokenProvider()
    if (token.isNullOrBlank()) {
      enqueue(
        "followed",
        "DELETE",
        json.encodeToString(MapSerializer(String.serializer(), String.serializer()), mapOf("id" to followedId))
      )
      db.followed().delete(followedId)
      return Result.success(true)
    }
    val result = apiClient.unfollowChallenge(token, followedId)
    return if (result.isSuccess) {
      db.followed().delete(followedId)
      Result.success(true)
    } else {
      enqueue(
        "followed",
        "DELETE",
        json.encodeToString(MapSerializer(String.serializer(), String.serializer()), mapOf("id" to followedId))
      )
      Result.success(true)
    }
  }

  suspend fun listPublicChallenges(): Result<List<PublicChallenge>> {
    return apiClient.listPublicChallenges()
  }

  suspend fun syncQueue(): Result<Int> = withContext(Dispatchers.IO) {
    val token = tokenProvider() ?: return@withContext Result.failure(IllegalStateException("Missing token"))
    val items = db.queue().listAll()
    var synced = 0
    for (item in items) {
      val result = when (item.type) {
        "challenge" -> syncChallenge(token, item)
        "entry" -> syncEntry(token, item)
        "followed" -> syncFollowed(token, item)
        else -> Result.failure(IllegalStateException("Unknown queue type"))
      }
      if (result.isSuccess) {
        db.queue().delete(item.id)
        synced += 1
      } else {
        db.queue().incrementAttempts(item.id)
      }
    }
    Result.success(synced)
  }

  private suspend fun syncChallenge(token: String, item: QueueItem): Result<Unit> {
    return when (item.method) {
      "POST" -> apiClient.createChallenge(
        token,
        json.decodeFromString(ChallengePayload.serializer(), item.payloadJson)
      ).map { }
      "PATCH" -> {
        val queued = json.decodeFromString(QueuedChallengePayload.serializer(), item.payloadJson)
        val id = queued.id
        if (id.isNullOrBlank()) {
          Result.failure(IllegalStateException("Missing id"))
        } else {
          apiClient.updateChallenge(token, id, queued.payload).map { }
        }
      }
      "DELETE" -> {
        val id = json.decodeFromString(MapSerializer(String.serializer(), String.serializer()), item.payloadJson)["id"]
        if (id.isNullOrBlank()) {
          Result.failure(IllegalStateException("Missing id"))
        } else {
          apiClient.deleteChallenge(token, id).map { }
        }
      }
      else -> Result.failure(IllegalStateException("Unsupported method"))
    }
  }

  private suspend fun syncEntry(token: String, item: QueueItem): Result<Unit> {
    return when (item.method) {
      "POST" -> apiClient.createEntry(
        token,
        json.decodeFromString(EntryPayload.serializer(), item.payloadJson)
      ).map { }
      "PATCH" -> {
        val queued = json.decodeFromString(QueuedEntryPayload.serializer(), item.payloadJson)
        val id = queued.id
        if (id.isNullOrBlank()) {
          Result.failure(IllegalStateException("Missing id"))
        } else {
          apiClient.updateEntry(token, id, queued.payload).map { }
        }
      }
      "DELETE" -> {
        val id = json.decodeFromString(MapSerializer(String.serializer(), String.serializer()), item.payloadJson)["id"]
        if (id.isNullOrBlank()) {
          Result.failure(IllegalStateException("Missing id"))
        } else {
          apiClient.deleteEntry(token, id).map { }
        }
      }
      else -> Result.failure(IllegalStateException("Unsupported method"))
    }
  }

  private suspend fun syncFollowed(token: String, item: QueueItem): Result<Unit> {
    return when (item.method) {
      "POST" -> {
        val payload = json.decodeFromString(FollowedPayload.serializer(), item.payloadJson)
        apiClient.followChallenge(token, payload.challengeId).map { }
      }
      "DELETE" -> {
        val id = json.decodeFromString(MapSerializer(String.serializer(), String.serializer()), item.payloadJson)["id"]
        if (id.isNullOrBlank()) {
          Result.failure(IllegalStateException("Missing id"))
        } else {
          apiClient.unfollowChallenge(token, id).map { }
        }
      }
      else -> Result.failure(IllegalStateException("Unsupported method"))
    }
  }

  private suspend fun enqueue(type: String, method: String, payloadJson: String) {
    val item = QueueItem(
      id = UUID.randomUUID().toString(),
      type = type,
      method = method,
      payloadJson = payloadJson,
      createdAt = Instant.now().toString(),
      attempts = 0
    )
    db.queue().insert(item)
    onEnqueue?.invoke()
  }

  private fun ChallengePayload.toQueuePayload(id: String): QueuedChallengePayload {
    return QueuedChallengePayload(id = id, payload = this)
  }

  private fun EntryPayload.toQueuePayload(id: String): QueuedEntryPayload {
    return QueuedEntryPayload(id = id, payload = this)
  }

  private fun Challenge.toLocal(): LocalChallenge = LocalChallenge(
    id = id,
    name = name,
    targetNumber = targetNumber,
    color = color,
    icon = icon,
    timeframeUnit = timeframeUnit.name,
    startDate = startDate,
    endDate = endDate,
    year = year,
    isPublic = isPublic,
    archived = archived
  )

  private fun LocalChallenge.toDomain(): Challenge {
    val parsed = runCatching { TimeframeUnit.valueOf(timeframeUnit) }.getOrElse { TimeframeUnit.YEAR }
    return Challenge(
      id = id,
      name = name,
      targetNumber = targetNumber,
      color = color,
      icon = icon,
      timeframeUnit = parsed,
      startDate = startDate,
      endDate = endDate,
      year = year,
      isPublic = isPublic,
      archived = archived
    )
  }

  private fun Entry.toLocal(json: Json): LocalEntry = LocalEntry(
    id = id,
    challengeId = challengeId,
    date = date,
    count = count,
    note = note,
    feeling = feeling?.name,
    setsJson = sets?.let { json.encodeToString(ListSerializer(EntrySet.serializer()), it) },
    createdAt = createdAt
  )

  private fun LocalEntry.toDomain(json: Json): Entry {
    val sets = setsJson?.let { json.decodeFromString(ListSerializer(EntrySet.serializer()), it) }
    return Entry(
      id = id,
      challengeId = challengeId,
      date = date,
      count = count,
      note = note,
      feeling = runCatching { feeling?.let { Feeling.valueOf(it) } }.getOrNull(),
      sets = sets,
      createdAt = createdAt
    )
  }

  private fun EntryPayload.toLocalFallback(id: String? = null): LocalEntry = LocalEntry(
    id = id ?: "local_${UUID.randomUUID()}",
    challengeId = challengeId,
    date = date,
    count = count,
    note = note,
    feeling = feeling?.name,
    setsJson = sets?.let { json.encodeToString(ListSerializer(EntrySet.serializer()), it) },
    createdAt = Instant.now().toString()
  )

  private fun ChallengePayload.toLocalFallback(id: String? = null): LocalChallenge = LocalChallenge(
    id = id ?: "local_${UUID.randomUUID()}",
    name = name,
    targetNumber = targetNumber,
    color = color,
    icon = icon,
    timeframeUnit = timeframeUnit.name,
    startDate = startDate,
    endDate = endDate,
    year = year,
    isPublic = isPublic,
    archived = archived
  )

  private fun LocalFollowed.toDomain(): Followed = Followed(
    id = id,
    challengeId = challengeId,
    followedAt = followedAt
  )

  private fun Followed.toLocal(): LocalFollowed = LocalFollowed(
    id = id,
    challengeId = challengeId,
    followedAt = followedAt
  )
}
