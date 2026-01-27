package com.tally.core.data

import com.tally.core.network.ApiResult
import com.tally.core.network.Challenge
import com.tally.core.network.CreateEntryRequest
import com.tally.core.network.Entry
import com.tally.core.network.Feeling
import com.tally.core.network.TallyApiClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneOffset
import java.util.UUID

/**
 * Repository for entries with optimistic saves.
 * Saves locally immediately, syncs in background.
 * Mirrors iOS ChallengesManager entry handling pattern.
 */
class EntryRepository(
    private val apiClient: TallyApiClient,
    private val localStore: LocalEntryStore
) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    
    private val _syncState = MutableStateFlow(SyncState.SYNCED)
    val syncState: StateFlow<SyncState> = _syncState.asStateFlow()
    
    private val _isOnline = MutableStateFlow(true)
    val isOnline: StateFlow<Boolean> = _isOnline.asStateFlow()
    
    /**
     * Add an entry optimistically - saves locally first, syncs in background.
     * Returns immediately after local save for instant UI feedback.
     */
    fun addEntry(
        challengeId: String,
        date: String,
        count: Int,
        sets: List<Int>? = null,
        note: String? = null,
        feeling: Feeling? = null
    ) {
        val tempId = UUID.randomUUID().toString()
        val now = Instant.now().toString()
        
        // Create local entry immediately (optimistic)
        val entry = Entry(
            id = tempId,
            userId = "",  // Will be set by server
            challengeId = challengeId,
            date = date,
            count = count,
            sets = sets,
            note = note,
            feeling = feeling,
            createdAt = now,
            updatedAt = now
        )
        
        // Create the API request
        val request = CreateEntryRequest(
            challengeId = challengeId,
            date = date,
            count = count,
            note = note,
            feeling = feeling
        )
        
        // Save locally and queue for sync
        localStore.upsertEntry(entry)
        localStore.addPendingChange(
            EntryPendingChange.Create(
                entryId = tempId,
                request = SerializableCreateEntryRequest.from(request, sets)
            )
        )
        updateSyncState()
        
        // Try to sync immediately in background if online
        if (_isOnline.value) {
            scope.launch {
                syncPendingEntries()
            }
        }
    }
    
    /**
     * Get recent entries for a challenge (from local cache).
     */
    fun recentEntries(challengeId: String, limit: Int = 10): List<Entry> {
        return localStore.loadEntries(challengeId)
            .sortedByDescending { it.date }
            .take(limit)
    }
    
    /**
     * Fetch and cache entries for a challenge from server.
     */
    suspend fun fetchEntries(challengeId: String) {
        when (val result = apiClient.listEntries(challengeId = challengeId)) {
            is ApiResult.Success -> {
                localStore.mergeWithServer(result.data, challengeId)
                _isOnline.value = true
            }
            is ApiResult.Failure -> {
                // Failed to fetch, local cache remains
                // Could check if network error to set offline
            }
        }
    }
    
    /**
     * Sync all pending entry changes to server.
     */
    suspend fun syncPendingEntries() {
        val pendingChanges = localStore.loadPendingChanges()
        if (pendingChanges.isEmpty()) {
            updateSyncState()
            return
        }
        
        _syncState.value = SyncState.SYNCING
        
        for (change in pendingChanges) {
            when (change) {
                is EntryPendingChange.Create -> {
                    val result = apiClient.createEntry(change.request.toApiRequest())
                    when (result) {
                        is ApiResult.Success -> {
                            // Replace temp entry with server entry
                            localStore.removeEntry(change.entryId)
                            localStore.upsertEntry(result.data)
                            localStore.removePendingChange(change.entryId)
                        }
                        is ApiResult.Failure -> {
                            // Check if recoverable
                            if (!result.error.isRecoverable) {
                                localStore.removePendingChange(change.entryId)
                            }
                            // Keep recoverable errors in queue for retry
                        }
                    }
                }
                is EntryPendingChange.Update -> {
                    // TODO: Implement update sync if needed
                    localStore.removePendingChange(change.entryId)
                }
                is EntryPendingChange.Delete -> {
                    val result = apiClient.deleteEntry(change.entryId)
                    when (result) {
                        is ApiResult.Success -> {
                            localStore.removePendingChange(change.entryId)
                        }
                        is ApiResult.Failure -> {
                            if (!result.error.isRecoverable) {
                                localStore.removePendingChange(change.entryId)
                            }
                        }
                    }
                }
            }
        }
        
        updateSyncState()
    }
    
    /**
     * Clear all local data (for logout).
     */
    fun clearLocalData() {
        localStore.clearAll()
        updateSyncState()
    }
    
    private fun updateSyncState() {
        val pendingCount = localStore.loadPendingChanges().size
        _syncState.value = when {
            !_isOnline.value -> SyncState.LOCAL_ONLY
            pendingCount > 0 -> SyncState.PENDING
            else -> SyncState.SYNCED
        }
    }
}

/**
 * Sync state enum matching design system SyncState.
 */
enum class SyncState {
    SYNCED,
    SYNCING,
    PENDING,
    FAILED,
    LOCAL_ONLY
}
