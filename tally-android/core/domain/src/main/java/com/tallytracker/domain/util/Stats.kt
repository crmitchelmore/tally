package com.tallytracker.domain.util

import com.tallytracker.domain.model.Entry
import java.time.LocalDate
import java.time.temporal.ChronoUnit

/**
 * Statistics utilities for challenges - mirrors web stats.ts and iOS Stats.swift logic
 */
object Stats {
    
    data class ChallengeStats(
        val totalEntries: Int,
        val totalCount: Int,
        val streak: Int,
        val averagePerDay: Double,
        val daysActive: Int,
        val bestDay: DayStat?,
        val percentComplete: Double
    )
    
    data class DayStat(
        val date: LocalDate,
        val count: Int
    )
    
    /**
     * Calculate comprehensive stats for a challenge
     */
    fun calculateStats(
        entries: List<Entry>,
        target: Int,
        startDate: LocalDate,
        endDate: LocalDate? = null
    ): ChallengeStats {
        if (entries.isEmpty()) {
            return ChallengeStats(
                totalEntries = 0,
                totalCount = 0,
                streak = 0,
                averagePerDay = 0.0,
                daysActive = 0,
                bestDay = null,
                percentComplete = 0.0
            )
        }
        
        val totalCount = entries.sumOf { it.count }
        val percentComplete = if (target > 0) {
            minOf(totalCount.toDouble() / target * 100, 100.0)
        } else 0.0
        
        // Group by day
        val entriesByDay = entries
            .groupBy { LocalDate.parse(it.date) }
            .mapValues { (_, dayEntries) -> dayEntries.sumOf { it.count } }
        
        // Calculate streak
        val streak = calculateStreak(entriesByDay)
        
        // Find best day
        val bestDay = entriesByDay.maxByOrNull { it.value }?.let { (date, count) ->
            DayStat(date, count)
        }
        
        // Calculate days active and average
        val daysActive = entriesByDay.size
        val daysSinceStart = maxOf(1, ChronoUnit.DAYS.between(startDate, LocalDate.now()).toInt())
        val averagePerDay = totalCount.toDouble() / daysSinceStart
        
        return ChallengeStats(
            totalEntries = entries.size,
            totalCount = totalCount,
            streak = streak,
            averagePerDay = averagePerDay,
            daysActive = daysActive,
            bestDay = bestDay,
            percentComplete = percentComplete
        )
    }
    
    /**
     * Calculate current streak (consecutive days with entries)
     */
    fun calculateStreak(entriesByDay: Map<LocalDate, Int>): Int {
        if (entriesByDay.isEmpty()) return 0
        
        val today = LocalDate.now()
        val sortedDays = entriesByDay.keys.sortedDescending()
        
        var streak = 0
        var currentDate = today
        
        // Allow starting from yesterday if no entries today
        if (!sortedDays.contains(today)) {
            currentDate = today.minusDays(1)
        }
        
        for (day in sortedDays) {
            if (day == currentDate) {
                streak++
                currentDate = currentDate.minusDays(1)
            } else if (day.isBefore(currentDate)) {
                break
            }
        }
        
        return streak
    }
    
    /**
     * Calculate projected completion date based on current pace
     */
    fun projectedCompletion(
        currentCount: Int,
        target: Int,
        averagePerDay: Double
    ): LocalDate? {
        if (currentCount >= target || averagePerDay <= 0) return null
        
        val remaining = target - currentCount
        val daysNeeded = kotlin.math.ceil(remaining / averagePerDay).toInt()
        
        return LocalDate.now().plusDays(daysNeeded.toLong())
    }
    
    /**
     * Format pace comparison (ahead/behind target)
     */
    fun paceDescription(
        currentCount: Int,
        target: Int,
        startDate: LocalDate,
        endDate: LocalDate?
    ): String {
        if (endDate == null || target <= 0) {
            return "No deadline"
        }
        
        val totalDays = maxOf(1, ChronoUnit.DAYS.between(startDate, endDate).toInt())
        val daysElapsed = maxOf(1, ChronoUnit.DAYS.between(startDate, LocalDate.now()).toInt())
        
        val expectedCount = target.toDouble() * (daysElapsed.toDouble() / totalDays)
        val diff = currentCount - expectedCount
        
        return when {
            kotlin.math.abs(diff) < 1 -> "On track"
            diff > 0 -> "${diff.toInt()} ahead"
            else -> "${kotlin.math.abs(diff).toInt()} behind"
        }
    }
}
