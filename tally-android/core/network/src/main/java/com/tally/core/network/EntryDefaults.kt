package com.tally.core.network

import java.time.LocalDate
import kotlin.math.roundToInt

/**
 * Utilities for calculating smart initial values for new entries.
 * Uses the last 2 weeks of data to suggest starting values.
 */
object EntryDefaults {
    
    /**
     * Calculate initial value for a new entry based on recent history.
     *
     * - For simple count: returns the average count from the last 14 days, rounded to nearest 5.
     * - For sets: returns the average of first-set values from the last 14 days, rounded.
     *
     * @param entries All entries for the challenge
     * @param countType The challenge's count type
     * @return The suggested initial value (minimum 1)
     */
    fun calculateInitialValue(
        entries: List<Entry>,
        countType: CountType = CountType.SIMPLE
    ): Int {
        val twoWeeksAgo = LocalDate.now().minusDays(14)
        val cutoffDate = twoWeeksAgo.toString() // ISO format YYYY-MM-DD
        
        val recentEntries = entries.filter { it.date >= cutoffDate }
        
        if (recentEntries.isEmpty()) {
            return 1
        }
        
        return when (countType) {
            CountType.SETS -> {
                // For sets mode: average of first-set values
                val firstSetValues = recentEntries
                    .mapNotNull { it.sets?.firstOrNull() }
                
                if (firstSetValues.isEmpty()) {
                    calculateSimpleAverage(recentEntries)
                } else {
                    val avg = firstSetValues.average()
                    maxOf(1, avg.roundToInt())
                }
            }
            else -> calculateSimpleAverage(recentEntries)
        }
    }
    
    /**
     * Calculate simple average, rounded to nearest 5.
     */
    private fun calculateSimpleAverage(entries: List<Entry>): Int {
        if (entries.isEmpty()) return 1
        
        val avg = entries.map { it.count }.average()
        
        // Round to nearest 5 for cleaner numbers
        val rounded = ((avg / 5.0).roundToInt() * 5)
        return maxOf(1, if (rounded != 0) rounded else avg.roundToInt())
    }
    
    /**
     * Get the last set value for the "add another set" flow.
     *
     * @param currentSets The current sets array in the form
     * @return The last set value, or 1 if empty/invalid
     */
    fun getLastSetValue(currentSets: List<Int>): Int {
        val last = currentSets.lastOrNull()
        return if (last != null && last > 0) last else 1
    }
    
    /**
     * Calculate sets statistics for dashboard display.
     *
     * @param entries All entries (may include entries without sets)
     * @return Pair of bestSet and avgSetValue, or null values if no sets data
     */
    fun calculateSetsStats(entries: List<Entry>): Pair<Triple<Int, String, String>?, Double?> {
        // Collect all individual set values with metadata
        data class SetData(val value: Int, val date: String, val entryId: String)
        
        val allSets = mutableListOf<SetData>()
        
        for (entry in entries) {
            entry.sets?.forEach { setVal ->
                allSets.add(SetData(setVal, entry.date, entry.id))
            }
        }
        
        if (allSets.isEmpty()) {
            return Pair(null, null)
        }
        
        // Find best set
        val bestSet = allSets.maxByOrNull { it.value }?.let {
            Triple(it.value, it.date, it.entryId)
        }
        
        // Calculate average (one decimal place)
        val avgSetValue = (allSets.map { it.value }.average() * 10).roundToInt() / 10.0
        
        return Pair(bestSet, avgSetValue)
    }
}
