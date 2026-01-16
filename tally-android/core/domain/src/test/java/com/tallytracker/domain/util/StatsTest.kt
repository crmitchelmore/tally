package com.tallytracker.domain.util

import com.tallytracker.domain.model.Entry
import org.junit.Assert.*
import org.junit.Test
import java.time.LocalDate
import java.time.LocalDateTime

class StatsTest {
    
    @Test
    fun `calculateStats returns zeros for empty entries`() {
        val stats = Stats.calculateStats(
            entries = emptyList(),
            target = 100,
            startDate = LocalDate.now().minusDays(30)
        )
        
        assertEquals(0, stats.totalEntries)
        assertEquals(0, stats.totalCount)
        assertEquals(0, stats.streak)
        assertEquals(0.0, stats.averagePerDay, 0.01)
        assertEquals(0, stats.daysActive)
        assertNull(stats.bestDay)
        assertEquals(0.0, stats.percentComplete, 0.01)
    }
    
    @Test
    fun `calculateStats computes correct totals`() {
        val today = LocalDate.now()
        val entries = listOf(
            createEntry("1", today.toString(), 5),
            createEntry("2", today.minusDays(1).toString(), 3),
            createEntry("3", today.minusDays(2).toString(), 2)
        )
        
        val stats = Stats.calculateStats(
            entries = entries,
            target = 100,
            startDate = today.minusDays(10)
        )
        
        assertEquals(3, stats.totalEntries)
        assertEquals(10, stats.totalCount)
        assertEquals(10.0, stats.percentComplete, 0.01)
    }
    
    @Test
    fun `calculateStreak returns correct consecutive days`() {
        val today = LocalDate.now()
        val entriesByDay = mapOf(
            today to 1,
            today.minusDays(1) to 1,
            today.minusDays(2) to 1,
            today.minusDays(5) to 1 // gap
        )
        
        val streak = Stats.calculateStreak(entriesByDay)
        assertEquals(3, streak)
    }
    
    @Test
    fun `calculateStreak handles missing today`() {
        val today = LocalDate.now()
        val entriesByDay = mapOf(
            today.minusDays(1) to 1,
            today.minusDays(2) to 1
        )
        
        val streak = Stats.calculateStreak(entriesByDay)
        assertEquals(2, streak)
    }
    
    @Test
    fun `projectedCompletion returns null when target met`() {
        val result = Stats.projectedCompletion(
            currentCount = 100,
            target = 100,
            averagePerDay = 5.0
        )
        assertNull(result)
    }
    
    @Test
    fun `projectedCompletion calculates correct date`() {
        val result = Stats.projectedCompletion(
            currentCount = 50,
            target = 100,
            averagePerDay = 5.0
        )
        
        assertNotNull(result)
        // 50 remaining / 5 per day = 10 days
        assertEquals(LocalDate.now().plusDays(10), result)
    }
    
    @Test
    fun `paceDescription returns on track when close`() {
        val today = LocalDate.now()
        val startDate = today.minusDays(50)
        val endDate = today.plusDays(50)
        
        // At midpoint, should be at 50% of target
        val result = Stats.paceDescription(
            currentCount = 50,
            target = 100,
            startDate = startDate,
            endDate = endDate
        )
        
        assertEquals("On track", result)
    }
    
    @Test
    fun `paceDescription returns ahead when above pace`() {
        val today = LocalDate.now()
        val startDate = today.minusDays(50)
        val endDate = today.plusDays(50)
        
        val result = Stats.paceDescription(
            currentCount = 75,
            target = 100,
            startDate = startDate,
            endDate = endDate
        )
        
        assertTrue(result.contains("ahead"))
    }
    
    private fun createEntry(id: String, date: String, count: Int) = Entry(
        id = id,
        challengeId = "challenge1",
        date = date,
        count = count,
        note = null,
        createdAt = LocalDateTime.now()
    )
}
