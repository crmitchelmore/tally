package com.tallytracker.domain.util

import com.tallytracker.domain.model.Challenge
import com.tallytracker.domain.model.Entry
import com.tallytracker.domain.model.User
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/**
 * Handles data export and import for user data portability
 */
object DataPortability {
    
    private val json = Json {
        prettyPrint = true
        ignoreUnknownKeys = true
    }
    
    @Serializable
    data class ExportData(
        val exportDate: String,
        val version: String,
        val user: ExportUser?,
        val challenges: List<ExportChallenge>,
        val entries: List<ExportEntry>
    )
    
    @Serializable
    data class ExportUser(
        val id: String,
        val email: String?,
        val name: String?
    )
    
    @Serializable
    data class ExportChallenge(
        val id: String,
        val name: String,
        val target: Int,
        val color: String,
        val icon: String,
        val unit: String,
        val year: Int,
        val isPublic: Boolean
    )
    
    @Serializable
    data class ExportEntry(
        val id: String,
        val challengeId: String,
        val date: String,
        val count: Int,
        val note: String?
    )
    
    /**
     * Export all user data as JSON string
     */
    fun exportAllData(
        user: User?,
        challenges: List<Challenge>,
        entries: List<Entry>
    ): String {
        val exportData = ExportData(
            exportDate = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME),
            version = "1.0.0",
            user = user?.let { ExportUser(it.id, it.email, it.name) },
            challenges = challenges.map { c ->
                ExportChallenge(
                    id = c.id,
                    name = c.name,
                    target = c.target,
                    color = c.color,
                    icon = c.icon,
                    unit = c.unit,
                    year = c.year,
                    isPublic = c.isPublic
                )
            },
            entries = entries.map { e ->
                ExportEntry(
                    id = e.id,
                    challengeId = e.challengeId,
                    date = e.date,
                    count = e.count,
                    note = e.note
                )
            }
        )
        
        return json.encodeToString(exportData)
    }
    
    /**
     * Parse import data from JSON string
     */
    fun parseImportData(jsonString: String): ExportData {
        return json.decodeFromString(jsonString)
    }
}
