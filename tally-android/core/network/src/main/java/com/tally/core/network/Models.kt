package com.tally.core.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonNames

/**
 * API v1 models – matching web API types.
 */

// Challenge timeframe types
@Serializable
enum class TimeframeType {
    @SerialName("year") YEAR,
    @SerialName("month") MONTH,
    @SerialName("custom") CUSTOM
}

// Count type for challenges
@Serializable
enum class CountType {
    @SerialName("simple") SIMPLE,
    @SerialName("sets") SETS,
    @SerialName("custom") CUSTOM
}

// Feeling types for entries
@Serializable
enum class Feeling {
    @SerialName("great") GREAT,
    @SerialName("good") GOOD,
    @SerialName("okay") OKAY,
    @SerialName("tough") TOUGH
}

// Pace status
@Serializable
enum class PaceStatus {
    @SerialName("ahead") AHEAD,
    @SerialName("on-pace") ON_PACE,
    @SerialName("behind") BEHIND,
    @SerialName("none") NONE
}

/**
 * Challenge model
 */
@Serializable
data class Challenge(
    val id: String,
    val userId: String,
    val name: String,
    val target: Int,
    val timeframeType: TimeframeType,
    val startDate: String,
    val endDate: String,
    val color: String,
    val icon: String,
    val isPublic: Boolean,
    val isArchived: Boolean,
    val countType: CountType? = null,
    val unitLabel: String? = null,
    val defaultIncrement: Int? = null,
    val createdAt: String,
    val updatedAt: String
) {
    val resolvedCountType: CountType get() = countType ?: CountType.SIMPLE
    val resolvedUnitLabel: String get() = unitLabel ?: "reps"
    val resolvedDefaultIncrement: Int get() = defaultIncrement ?: 1
}

/**
 * Entry model
 */
@Serializable
data class Entry(
    val id: String,
    val userId: String,
    val challengeId: String,
    val date: String,
    val count: Int,
    val sets: List<Int>? = null,
    val note: String? = null,
    val feeling: Feeling? = null,
    val createdAt: String,
    val updatedAt: String
)

/**
 * Best day record
 */
@Serializable
data class BestDay(
    val date: String,
    val count: Int
)

/**
 * Challenge stats
 */
@Serializable
data class ChallengeStats(
    val challengeId: String,
    val totalCount: Int,
    val remaining: Int,
    val daysElapsed: Int,
    val daysRemaining: Int,
    val perDayRequired: Double,
    val currentPace: Double,
    val paceStatus: PaceStatus,
    val streakCurrent: Int,
    val streakBest: Int,
    val bestDay: BestDay? = null,
    val dailyAverage: Double
)

/**
 * Best set record
 */
@Serializable
data class BestSet(
    val value: Int,
    val date: String,
    val challengeId: String
)

/**
 * Dashboard stats
 */
@Serializable
data class DashboardStats(
    val totalMarks: Int,
    val today: Int,
    val bestStreak: Int,
    val overallPaceStatus: PaceStatus,
    val bestSet: BestSet? = null,
    val avgSetValue: Double? = null
)

/**
 * Highest daily average record
 */
@Serializable
data class HighestDailyAverage(
    val challengeId: String,
    val average: Double
)

/**
 * Biggest single entry record
 */
@Serializable
data class BiggestSingleEntry(
    val date: String,
    val count: Int,
    val challengeId: String
)

/**
 * Personal records
 */
@Serializable
data class PersonalRecords(
    val bestSingleDay: BestDay? = null,
    val longestStreak: Int,
    val highestDailyAverage: HighestDailyAverage? = null,
    val mostActiveDays: Int,
    val biggestSingleEntry: BiggestSingleEntry? = null,
    val bestSet: BestSet? = null,
    val avgSetValue: Double? = null
)

/**
 * Dashboard panel identifiers
 */
@Serializable
enum class DashboardPanel {
    @SerialName("activeChallenges") ACTIVE_CHALLENGES,
    @SerialName("highlights") HIGHLIGHTS,
    @SerialName("personalRecords") PERSONAL_RECORDS,
    @SerialName("progressGraph") PROGRESS_GRAPH,
    @SerialName("burnUpChart") BURN_UP_CHART;

    val title: String
        get() = when (this) {
            ACTIVE_CHALLENGES -> "Active Challenges"
            HIGHLIGHTS -> "Highlights"
            PERSONAL_RECORDS -> "Personal Records"
            PROGRESS_GRAPH -> "Progress Graph"
            BURN_UP_CHART -> "Goal Progress"
        }

    companion object {
        val DEFAULT_ORDER = listOf(
            ACTIVE_CHALLENGES,
            HIGHLIGHTS,
            PERSONAL_RECORDS,
            PROGRESS_GRAPH,
            BURN_UP_CHART
        )
    }
}

/**
 * Dashboard panel configuration
 * Supports both API format (visible/hidden) and internal format (visiblePanels/hiddenPanels)
 */
@Serializable
data class DashboardConfig(
    @JsonNames("visible") val visiblePanels: List<DashboardPanel> = DashboardPanel.DEFAULT_ORDER,
    @JsonNames("hidden") val hiddenPanels: List<DashboardPanel> = emptyList()
) {
    companion object {
        val DEFAULT = DashboardConfig()
    }
}

/**
 * Pagination info
 */
@Serializable
data class PaginationInfo(
    val page: Int,
    val pageSize: Int,
    val total: Int,
    val totalPages: Int
)

/**
 * Paginated response wrapper
 */
@Serializable
data class PaginatedResponse<T>(
    val data: List<T>,
    val pagination: PaginationInfo
)
