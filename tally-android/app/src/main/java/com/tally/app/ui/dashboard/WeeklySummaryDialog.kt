package com.tally.app.ui.dashboard

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowLeft
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.tally.app.ui.IconMapper
import com.tally.app.ui.parseHexColor
import com.tally.core.design.TallySpacing
import com.tally.core.network.Challenge
import com.tally.core.network.Entry
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.util.Locale

/**
 * Dialog showing a weekly activity summary with daily breakdown and challenge stats.
 */
@Composable
fun WeeklySummaryDialog(
    entries: List<Entry>,
    challenges: List<Challenge>,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    var weekOffset by remember { mutableIntStateOf(0) }
    
    val today = LocalDate.now()
    val weekStart = today.minusWeeks(weekOffset.toLong()).with(DayOfWeek.MONDAY)
    val weekEnd = weekStart.plusDays(6)
    
    // Filter entries to this week
    val weekEntries = remember(entries, weekOffset) {
        entries.filter { entry ->
            val entryDate = LocalDate.parse(entry.date, DateTimeFormatter.ISO_LOCAL_DATE)
            !entryDate.isBefore(weekStart) && !entryDate.isAfter(weekEnd)
        }
    }
    
    // Group entries by day
    val entriesByDay = remember(weekEntries) {
        weekEntries.groupBy { entry ->
            LocalDate.parse(entry.date, DateTimeFormatter.ISO_LOCAL_DATE)
        }
    }
    
    // Calculate daily counts
    val dailyCounts = remember(entriesByDay) {
        (0..6).map { dayOffset ->
            val date = weekStart.plusDays(dayOffset.toLong())
            entriesByDay[date]?.sumOf { it.count } ?: 0
        }
    }
    
    // Find most active day
    val mostActiveDay = remember(dailyCounts) {
        val maxCount = dailyCounts.maxOrNull() ?: 0
        if (maxCount > 0) {
            val dayIndex = dailyCounts.indexOf(maxCount)
            val date = weekStart.plusDays(dayIndex.toLong())
            date.dayOfWeek.getDisplayName(TextStyle.FULL, Locale.getDefault()) to maxCount
        } else {
            null
        }
    }
    
    // Group entries by challenge
    val entriesByChallenge = remember(weekEntries) {
        weekEntries.groupBy { it.challengeId }
    }
    
    // Date formatter for the header
    val headerFormatter = DateTimeFormatter.ofPattern("d MMM", Locale.getDefault())
    val yearFormatter = DateTimeFormatter.ofPattern("yyyy", Locale.getDefault())
    val weekRangeText = "${weekStart.format(headerFormatter)} - ${weekEnd.format(headerFormatter)} ${weekEnd.format(yearFormatter)}"
    
    AlertDialog(
        onDismissRequest = onDismiss,
        modifier = modifier,
        title = {
            Column {
                Text(
                    text = "Weekly Summary",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(TallySpacing.xs))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    IconButton(onClick = { weekOffset++ }) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.KeyboardArrowLeft,
                            contentDescription = "Previous week"
                        )
                    }
                    Text(
                        text = if (weekOffset == 0) "This Week" else weekRangeText,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.primary,
                        fontWeight = FontWeight.Medium
                    )
                    IconButton(
                        onClick = { weekOffset-- },
                        enabled = weekOffset > 0
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.KeyboardArrowRight,
                            contentDescription = "Next week"
                        )
                    }
                }
            }
        },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(TallySpacing.md)
            ) {
                // Daily Breakdown
                DailyBreakdownSection(
                    dailyCounts = dailyCounts,
                    weekStart = weekStart,
                    today = today
                )
                
                HorizontalDivider()
                
                // Challenge Breakdown
                if (entriesByChallenge.isNotEmpty()) {
                    ChallengeBreakdownSection(
                        entriesByChallenge = entriesByChallenge,
                        challenges = challenges
                    )
                    
                    HorizontalDivider()
                }
                
                // Summary Stats
                SummaryStatsSection(
                    totalEntries = weekEntries.size,
                    totalCount = weekEntries.sumOf { it.count },
                    mostActiveDay = mostActiveDay
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

/**
 * Daily breakdown bar chart section.
 */
@Composable
private fun DailyBreakdownSection(
    dailyCounts: List<Int>,
    weekStart: LocalDate,
    today: LocalDate
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(TallySpacing.sm)
    ) {
        Text(
            text = "Daily Breakdown",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )
        
        val maxCount = dailyCounts.maxOrNull()?.coerceAtLeast(1) ?: 1
        val barHeight = 120.dp
        val primaryColor = MaterialTheme.colorScheme.primary
        val surfaceVariant = MaterialTheme.colorScheme.surfaceVariant
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            dailyCounts.forEachIndexed { index, count ->
                val date = weekStart.plusDays(index.toLong())
                val isToday = date == today
                val dayName = date.dayOfWeek.getDisplayName(TextStyle.SHORT, Locale.getDefault())
                
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(TallySpacing.xs)
                ) {
                    // Day label
                    Text(
                        text = dayName,
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = if (isToday) FontWeight.Bold else FontWeight.Normal,
                        color = if (isToday) primaryColor else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    
                    // Bar
                    Box(
                        modifier = Modifier
                            .width(32.dp)
                            .height(barHeight),
                        contentAlignment = Alignment.BottomCenter
                    ) {
                        val barHeightFraction = if (count > 0) count.toFloat() / maxCount.toFloat() else 0f
                        val actualBarHeight = barHeight * barHeightFraction
                        
                        Canvas(
                            modifier = Modifier
                                .width(32.dp)
                                .height(actualBarHeight.coerceAtLeast(2.dp))
                        ) {
                            val barColor = if (isToday) primaryColor else surfaceVariant
                            drawRoundRect(
                                color = barColor,
                                topLeft = Offset.Zero,
                                size = Size(size.width, size.height),
                                cornerRadius = CornerRadius(8f, 8f)
                            )
                        }
                    }
                    
                    // Count label
                    Text(
                        text = count.toString(),
                        style = MaterialTheme.typography.labelSmall,
                        fontWeight = if (isToday) FontWeight.Bold else FontWeight.Normal,
                        color = if (isToday) primaryColor else MaterialTheme.colorScheme.onSurface
                    )
                }
            }
        }
    }
}

/**
 * Challenge breakdown section showing stats per challenge.
 */
@Composable
private fun ChallengeBreakdownSection(
    entriesByChallenge: Map<String, List<Entry>>,
    challenges: List<Challenge>
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(TallySpacing.sm)
    ) {
        Text(
            text = "Challenge Breakdown",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )
        
        entriesByChallenge.forEach { (challengeId, challengeEntries) ->
            val challenge = challenges.find { it.id == challengeId }
            if (challenge != null) {
                ChallengeBreakdownCard(
                    challenge = challenge,
                    entries = challengeEntries
                )
            }
        }
    }
}

/**
 * Card showing challenge stats for the week.
 */
@Composable
private fun ChallengeBreakdownCard(
    challenge: Challenge,
    entries: List<Entry>
) {
    val tintColor = parseHexColor(challenge.color)
    val totalCount = entries.sumOf { it.count }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(TallySpacing.sm),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(TallySpacing.sm),
                modifier = Modifier.weight(1f)
            ) {
                // Challenge icon
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(tintColor.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = IconMapper.getIcon(challenge.icon),
                        contentDescription = null,
                        tint = tintColor,
                        modifier = Modifier.size(18.dp)
                    )
                }
                
                // Challenge name
                Text(
                    text = challenge.name,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.weight(1f)
                )
            }
            
            // Total count
            Text(
                text = totalCount.toString(),
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = tintColor
            )
        }
    }
}

/**
 * Summary stats section.
 */
@Composable
private fun SummaryStatsSection(
    totalEntries: Int,
    totalCount: Int,
    mostActiveDay: Pair<String, Int>?
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(TallySpacing.sm)
    ) {
        Text(
            text = "Summary",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )
        
        // Stats rows
        StatRow(label = "Total Entries", value = totalEntries.toString())
        StatRow(label = "Total Count", value = totalCount.toString())
        
        if (mostActiveDay != null) {
            StatRow(
                label = "Most Active Day",
                value = "${mostActiveDay.first} (${mostActiveDay.second})"
            )
        } else {
            StatRow(label = "Most Active Day", value = "-")
        }
    }
}

/**
 * Simple stat row component.
 */
@Composable
private fun StatRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Medium
        )
    }
}
