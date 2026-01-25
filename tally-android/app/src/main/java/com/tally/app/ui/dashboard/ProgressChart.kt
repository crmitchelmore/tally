package com.tally.app.ui.dashboard

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tally.core.design.TallySpacing
import com.tally.core.network.Challenge
import com.tally.core.network.Entry
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

/**
 * Progress chart showing cumulative progress over time.
 */
@Composable
fun ProgressChart(
    challenges: List<Challenge>,
    entries: List<Entry>,
    modifier: Modifier = Modifier
) {
    var selectedChallengeId by remember { mutableStateOf<String?>(null) }
    
    val filteredEntries = remember(entries, selectedChallengeId) {
        if (selectedChallengeId != null) {
            entries.filter { it.challengeId == selectedChallengeId }
        } else {
            entries
        }
    }
    
    // Build cumulative data points
    val dataPoints = remember(filteredEntries) {
        buildCumulativeData(filteredEntries)
    }
    
    val chartColor = MaterialTheme.colorScheme.primary
    val gridColor = MaterialTheme.colorScheme.outlineVariant

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(TallySpacing.md),
            verticalArrangement = Arrangement.spacedBy(TallySpacing.sm)
        ) {
            Text(
                text = "Progress Over Time",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            // Challenge filter chips
            if (challenges.isNotEmpty()) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(TallySpacing.xs)
                ) {
                    FilterChip(
                        selected = selectedChallengeId == null,
                        onClick = { selectedChallengeId = null },
                        label = { Text("All") }
                    )
                    challenges.take(3).forEach { challenge ->
                        FilterChip(
                            selected = selectedChallengeId == challenge.id,
                            onClick = { 
                                selectedChallengeId = if (selectedChallengeId == challenge.id) null else challenge.id 
                            },
                            label = { Text(challenge.name.take(10)) }
                        )
                    }
                }
            }

            // Chart
            if (dataPoints.size >= 2) {
                Canvas(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(150.dp)
                ) {
                    val width = size.width
                    val height = size.height
                    val padding = 8.dp.toPx()
                    
                    val maxValue = dataPoints.maxOf { it.second }.toFloat().coerceAtLeast(1f)
                    val minX = dataPoints.minOf { it.first }
                    val maxX = dataPoints.maxOf { it.first }
                    val xRange = (maxX - minX).toFloat().coerceAtLeast(1f)
                    
                    // Draw grid lines
                    for (i in 0..4) {
                        val y = padding + (height - 2 * padding) * (1 - i / 4f)
                        drawLine(
                            color = gridColor,
                            start = Offset(padding, y),
                            end = Offset(width - padding, y),
                            strokeWidth = 1.dp.toPx()
                        )
                    }
                    
                    // Draw line chart
                    val path = Path()
                    dataPoints.forEachIndexed { index, (dayIndex, value) ->
                        val x = padding + (width - 2 * padding) * ((dayIndex - minX) / xRange)
                        val y = padding + (height - 2 * padding) * (1 - value / maxValue)
                        
                        if (index == 0) {
                            path.moveTo(x, y)
                        } else {
                            path.lineTo(x, y)
                        }
                    }
                    
                    drawPath(
                        path = path,
                        color = chartColor,
                        style = Stroke(width = 2.dp.toPx(), cap = StrokeCap.Round)
                    )
                    
                    // Draw dots
                    dataPoints.forEach { (dayIndex, value) ->
                        val x = padding + (width - 2 * padding) * ((dayIndex - minX) / xRange)
                        val y = padding + (height - 2 * padding) * (1 - value / maxValue)
                        
                        drawCircle(
                            color = chartColor,
                            radius = 4.dp.toPx(),
                            center = Offset(x, y)
                        )
                    }
                }
            } else {
                Text(
                    text = "Not enough data yet",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

private fun buildCumulativeData(entries: List<Entry>): List<Pair<Long, Int>> {
    if (entries.isEmpty()) return emptyList()
    
    val formatter = DateTimeFormatter.ISO_LOCAL_DATE
    val baseDate = LocalDate.now().minusMonths(3)
    
    // Group entries by date and calculate daily totals
    val dailyTotals = entries
        .groupBy { it.date }
        .mapValues { (_, v) -> v.sumOf { it.count } }
        .toSortedMap()
    
    if (dailyTotals.isEmpty()) return emptyList()
    
    // Build cumulative data
    var cumulative = 0
    return dailyTotals.map { (dateStr, count) ->
        cumulative += count
        val date = LocalDate.parse(dateStr, formatter)
        val dayIndex = ChronoUnit.DAYS.between(baseDate, date)
        dayIndex to cumulative
    }
}
