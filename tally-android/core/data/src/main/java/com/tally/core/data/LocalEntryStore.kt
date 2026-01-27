package com.tally.core.data

import android.content.Context
import android.content.SharedPreferences
import com.tally.core.network.Entry
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/**
 * Local persistence for entries using SharedPreferences.
 * Provides offline-first capability with sync state tracking.
 * Mirrors iOS LocalEntryStore pattern.
 */
class LocalEntryStore(context: Context) {
    
    private val prefs: SharedPreferences = context.getSharedPreferences(
        PREFS_NAME,
        Context.MODE_PRIVATE
    )
    
    private val json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }
    
    // MARK: - Entries CRUD
    
    /** Load all locally stored entries */
    fun loadEntries(): List<Entry> {
        val data = prefs.getString(ENTRIES_KEY, null) ?: return emptyList()
        return try {
            json.decodeFromString<List<Entry>>(data)
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    /** Load entries for a specific challenge */
    fun loadEntries(challengeId: String): List<Entry> {
        return loadEntries().filter { it.challengeId == challengeId }
    }
    
    /** Save entries to local storage */
    fun saveEntries(entries: List<Entry>) {
        val data = json.encodeToString(entries)
        prefs.edit().putString(ENTRIES_KEY, data).apply()
    }
    
    /** Get a single entry by ID */
    fun getEntry(id: String): Entry? {
        return loadEntries().find { it.id == id }
    }
    
    /** Add or update an entry locally */
    fun upsertEntry(entry: Entry) {
        val entries = loadEntries().toMutableList()
        val index = entries.indexOfFirst { it.id == entry.id }
        if (index >= 0) {
            entries[index] = entry
        } else {
            entries.add(entry)
        }
        saveEntries(entries)
    }
    
    /** Remove an entry from local storage */
    fun removeEntry(id: String) {
        val entries = loadEntries().toMutableList()
        entries.removeAll { it.id == id }
        saveEntries(entries)
    }
    
    // MARK: - Pending Changes Queue
    
    /** Load pending changes that need to be synced */
    fun loadPendingChanges(): List<EntryPendingChange> {
        val data = prefs.getString(PENDING_KEY, null) ?: return emptyList()
        return try {
            json.decodeFromString<List<EntryPendingChange>>(data)
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    /** Save pending changes */
    fun savePendingChanges(changes: List<EntryPendingChange>) {
        val data = json.encodeToString(changes)
        prefs.edit().putString(PENDING_KEY, data).apply()
    }
    
    /** Add a change to the pending queue */
    fun addPendingChange(change: EntryPendingChange) {
        val changes = loadPendingChanges().toMutableList()
        // Dedupe: remove existing changes for the same entry
        changes.removeAll { it.entryId == change.entryId }
        changes.add(change)
        savePendingChanges(changes)
    }
    
    /** Remove a change from the pending queue */
    fun removePendingChange(entryId: String) {
        val changes = loadPendingChanges().toMutableList()
        changes.removeAll { it.entryId == entryId }
        savePendingChanges(changes)
    }
    
    /** Clear all pending changes */
    fun clearPendingChanges() {
        savePendingChanges(emptyList())
    }
    
    // MARK: - Utilities
    
    /** Merge server entries with local data for a challenge */
    fun mergeWithServer(serverEntries: List<Entry>, challengeId: String) {
        val pendingIds = loadPendingChanges().map { it.entryId }.toSet()
        val allEntries = loadEntries().toMutableList()
        
        // Remove old entries for this challenge (except pending ones)
        allEntries.removeAll { entry ->
            entry.challengeId == challengeId && entry.id !in pendingIds
        }
        
        // Add server entries (but keep local versions if pending)
        for (serverEntry in serverEntries) {
            if (serverEntry.id !in pendingIds) {
                allEntries.add(serverEntry)
            }
        }
        
        saveEntries(allEntries)
    }
    
    /** Clear all local data (for logout) */
    fun clearAll() {
        prefs.edit()
            .remove(ENTRIES_KEY)
            .remove(PENDING_KEY)
            .apply()
    }
    
    companion object {
        private const val PREFS_NAME = "tally_entries"
        private const val ENTRIES_KEY = "entries_data"
        private const val PENDING_KEY = "entries_pending"
    }
}
