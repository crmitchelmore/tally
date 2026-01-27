package com.tally.core.data

import com.tally.core.network.CreateEntryRequest
import kotlinx.serialization.Serializable

/**
 * Types of entry changes that can be queued for sync.
 * Mirrors iOS EntryPendingChange pattern.
 */
@Serializable
sealed class EntryPendingChange {
    abstract val entryId: String
    
    @Serializable
    data class Create(
        override val entryId: String,
        val request: SerializableCreateEntryRequest
    ) : EntryPendingChange()
    
    @Serializable
    data class Update(
        override val entryId: String
    ) : EntryPendingChange()
    
    @Serializable
    data class Delete(
        override val entryId: String
    ) : EntryPendingChange()
}

/**
 * Serializable version of CreateEntryRequest for storing in pending queue.
 */
@Serializable
data class SerializableCreateEntryRequest(
    val challengeId: String,
    val date: String,
    val count: Int,
    val sets: List<Int>? = null,
    val note: String? = null,
    val feeling: String? = null
) {
    fun toApiRequest(): CreateEntryRequest {
        return CreateEntryRequest(
            challengeId = challengeId,
            date = date,
            count = count,
            note = note,
            feeling = feeling?.let { 
                com.tally.core.network.Feeling.valueOf(it.uppercase()) 
            }
        )
    }
    
    companion object {
        fun from(request: CreateEntryRequest, sets: List<Int>? = null): SerializableCreateEntryRequest {
            return SerializableCreateEntryRequest(
                challengeId = request.challengeId,
                date = request.date,
                count = request.count,
                sets = sets,
                note = request.note,
                feeling = request.feeling?.name
            )
        }
    }
}
