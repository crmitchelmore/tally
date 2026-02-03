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
    @SerialName("user_id") val userId: String,
    val name: String,
    val target: Int,
    @SerialName("timeframe_type") val timeframeType: TimeframeType,
    @SerialName("start_date") val startDate: String,
    @SerialName("end_date") val endDate: String,
    val color: String,
    val icon: String,
    @SerialName("is_public") val isPublic: Boolean,
    @SerialName("is_archived") val isArchived: Boolean,
    // Count configuration (optional for backward compatibility)
    @SerialName("count_type") val countType: CountType? = null,
    @SerialName("unit_label") val unitLabel: String? = null,
    @SerialName("default_increment") val defaultIncrement: Int? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String
) {
    // Convenience properties with defaults
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
    @SerialName("user_id") val userId: String,
    @SerialName("challenge_id") val challengeId: String,
    val date: String,
    val count: Int,
    val sets: List<Int>? = null,
    val note: String? = null,
    val feeling: Feeling? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("updated_at") val updatedAt: String
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
    @SerialName("challenge_id") val challengeId: String,
    @SerialName("total_count") val totalCount: Int,
    val remaining: Int,
    @SerialName("days_elapsed") val daysElapsed: Int,
    @SerialName("days_remaining") val daysRemaining: Int,
    @SerialName("per_day_required") val perDayRequired: Double,
    @SerialName("current_pace") val currentPace: Double,
    @SerialName("pace_status") val paceStatus: PaceStatus,
    @SerialName("streak_current") val streakCurrent: Int,
    @SerialName("streak_best") val streakBest: Int,
    @SerialName("best_day") val bestDay: BestDay? = null,
    @SerialName("daily_average") val dailyAverage: Double
)

/**
 * Best set record
 */
@Serializable
data class BestSet(
    val value: Int,
    val date: String,
    @SerialName("challenge_id") val challengeId: String
)

/**
 * Dashboard stats
 */
@Serializable
data class DashboardStats(
    @SerialName("total_marks") val totalMarks: Int,
    val today: Int,
    @SerialName("best_streak") val bestStreak: Int,
    @SerialName("overall_pace_status") val overallPaceStatus: PaceStatus,
    // Sets-specific stats
    @SerialName("best_set") val bestSet: BestSet? = null,
    @SerialName("avg_set_value") val avgSetValue: Double? = null
)

/**
 * Highest daily average record
 */
@Serializable
data class HighestDailyAverage(
    @SerialName("challenge_id") val challengeId: String,
    val average: Double
)

/**
 * Biggest single entry record
 */
@Serializable
data class BiggestSingleEntry(
    val date: String,
    val count: Int,
    @SerialName("challenge_id") val challengeId: String
)

/**
 * Personal records
 */
@Serializable
data class PersonalRecords(
    @SerialName("best_single_day") val bestSingleDay: BestDay? = null,
    @SerialName("longest_streak") val longestStreak: Int,
    @SerialName("highest_daily_average") val highestDailyAverage: HighestDailyAverage? = null,
    @SerialName("most_active_days") val mostActiveDays: Int,
    @SerialName("biggest_single_entry") val biggestSingleEntry: BiggestSingleEntry? = null,
    // Sets-specific records
    @SerialName("best_set") val bestSet: BestSet? = null,
    @SerialName("avg_set_value") val avgSetValue: Double? = null
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
    @SerialName("page_size") val pageSize: Int,
    val total: Int,
    @SerialName("total_pages") val totalPages: Int
)

/**
 * Paginated response wrapper
 */
@Serializable
data class PaginatedResponse<T>(
    val data: List<T>,
    val pagination: PaginationInfo
)
