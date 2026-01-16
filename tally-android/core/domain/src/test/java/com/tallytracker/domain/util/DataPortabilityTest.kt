package com.tallytracker.domain.util

import com.tallytracker.domain.model.Challenge
import com.tallytracker.domain.model.Entry
import com.tallytracker.domain.model.User
import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDateTime

class DataPortabilityTest {
    
    @Test
    fun `exportAllData creates valid JSON`() {
        val user = User(
            id = "user1",
            email = "test@example.com",
            name = "Test User",
            avatarUrl = null
        )
        
        val challenges = listOf(
            Challenge(
                id = "c1",
                name = "Read Books",
                target = 52,
                color = "#FF5722",
                icon = "📚",
                unit = "year",
                year = 2026,
                isPublic = false,
                archived = false,
                currentCount = 10
            )
        )
        
        val entries = listOf(
            Entry(
                id = "e1",
                challengeId = "c1",
                date = "2026-01-15",
                count = 1,
                note = "Great book!",
                createdAt = LocalDateTime.now()
            )
        )
        
        val json = DataPortability.exportAllData(user, challenges, entries)
        
        assertTrue(json.contains("\"version\": \"1.0.0\""))
        assertTrue(json.contains("\"email\": \"test@example.com\""))
        assertTrue(json.contains("\"name\": \"Read Books\""))
        assertTrue(json.contains("\"note\": \"Great book!\""))
    }
    
    @Test
    fun `parseImportData parses valid JSON`() {
        val json = """
        {
            "exportDate": "2026-01-16T10:00:00",
            "version": "1.0.0",
            "user": {
                "id": "user1",
                "email": "test@example.com",
                "name": "Test"
            },
            "challenges": [
                {
                    "id": "c1",
                    "name": "Test Challenge",
                    "target": 100,
                    "color": "#000000",
                    "icon": "✅",
                    "unit": "year",
                    "year": 2026,
                    "isPublic": false
                }
            ],
            "entries": []
        }
        """.trimIndent()
        
        val data = DataPortability.parseImportData(json)
        
        assertEquals("1.0.0", data.version)
        assertEquals("test@example.com", data.user?.email)
        assertEquals(1, data.challenges.size)
        assertEquals("Test Challenge", data.challenges[0].name)
    }
    
    @Test
    fun `exportAllData handles null user`() {
        val json = DataPortability.exportAllData(
            user = null,
            challenges = emptyList(),
            entries = emptyList()
        )
        
        assertTrue(json.contains("\"user\": null"))
    }
}
