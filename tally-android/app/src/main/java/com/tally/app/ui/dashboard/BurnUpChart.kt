package com.tally.app.ui.dashboard

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
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
 * Burn-up chart showing progress vs expected trajectory toward goal.
 */
@Composable
fun BurnUpChart(
    challenge: Challenge,
    entries: List<Entry>,
    modifier: Modifier = Modifier
) {
    val formatter = DateTimeFormatter.ISO_LOCAL_DATE
    val startDate = remember(challenge) { LocalDate.parse(challenge.startDate, formatter) }
    val endDate = remember(challenge) { LocalDate.parse(challenge.endDate, formatter) }
    val today = LocalDate.now()
    val totalDays = ChronoUnit.DAYS.between(startDate, endDate).toFloat().coerceAtLeast(1f)
    val daysElapsed = ChronoUnit.DAYS.between(startDate, today).toFloat().coerceIn(0f, totalDays)
    
    // Calculate cumulative progress by day
    val progressData = remember(entries) {
        buildProgressData(entries, startDate, today)
    }
    
    val actualColor = MaterialTheme.colorScheme.primary
    val expectedColor = MaterialTheme.colorScheme.outline
    val goalColor = MaterialTheme.colorScheme.tertiary
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
                text = "Burn-Up: ${challenge.name}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            Canvas(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(150.dp)
            ) {
                val width = size.width
                val height = size.height
                val padding = 8.dp.toPx()
                val chartWidth = width - 2 * padding
                val chartHeight = height - 2 * padding
                
                val maxValue = challenge.target.toFloat()
                
                // Draw grid lines
                for (i in 0..4) {
                    val y = padding + chartHeight * (1 - i / 4f)
                    drawLine(
                        color = gridColor,
                        start = Offset(padding, y),
                        end = Offset(width - padding, y),
                        strokeWidth = 1.dp.toPx()
                    )
                }
                
                // Draw goal line (horizontal at target)
                val goalY = padding + chartHeight * (1 - maxValue / maxValue)
                drawLine(
                    color = goalColor,
                    start = Offset(padding, goalY),
                    end = Offset(width - padding, goalY),
                    strokeWidth = 2.dp.toPx(),
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 10f))
                )
                
                // Draw expected trajectory (diagonal from 0 to target)
                drawLine(
                    color = expectedColor,
                    start = Offset(padding, padding + chartHeight),
                    end = Offset(width - padding, goalY),
                    strokeWidth = 1.5.dp.toPx(),
                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(6f, 6f))
                )
                
                // Draw actual progress
                if (progressData.isNotEmpty()) {
                    val path = Path()
                    
                    progressData.forEachIndexed { index, (dayOffset, cumulative) ->
                        val x = padding + chartWidth * (dayOffset / totalDays)
                        val y = padding + chartHeight * (1 - cumulative.coerceAtMost(maxValue.toInt()) / maxValue)
                        
                        if (index == 0) {
                            path.moveTo(padding, padding + chartHeight) // Start from 0
                            path.lineTo(x, y)
                        } else {
                            path.lineTo(x, y)
                        }
                    }
                    
                    drawPath(
                        path = path,
                        color = actualColor,
                        style = Stroke(width = 2.5.dp.toPx(), cap = StrokeCap.Round)
                    )
                }
            }

            // Legend
            Column(
                verticalArrangement = Arrangement.spacedBy(TallySpacing.xs)
            ) {
                LegendItem(color = actualColor, label = "Actual Progress")
                LegendItem(color = expectedColor, label = "Expected Pace")
                LegendItem(color = goalColor, label = "Goal: ${challenge.target}")
            }
        }
    }
}

@Composable
private fun LegendItem(
    color: Color,
    label: String
) {
    androidx.compose.foundation.layout.Row(
        horizontalArrangement = Arrangement.spacedBy(TallySpacing.xs),
        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
    ) {
        Canvas(modifier = Modifier.height(12.dp).padding(end = TallySpacing.xs)) {
            drawLine(
                color = color,
                start = Offset(0f, size.height / 2),
                end = Offset(20.dp.toPx(), size.height / 2),
                strokeWidth = 2.dp.toPx()
            )
        }
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

private fun buildProgressData(
    entries: List<Entry>,
    startDate: LocalDate,
    today: LocalDate
): List<Pair<Float, Int>> {
    if (entries.isEmpty()) return emptyList()
    
    val formatter = DateTimeFormatter.ISO_LOCAL_DATE
    
    // Group entries by date and build cumulative
    val dailyTotals = entries
        .groupBy { it.date }
        .mapValues { (_, v) -> v.sumOf { it.count } }
        .toSortedMap()
    
    var cumulative = 0
    return dailyTotals.mapNotNull { (dateStr, count) ->
        val date = LocalDate.parse(dateStr, formatter)
        if (date.isBefore(startDate)) return@mapNotNull null
        
        cumulative += count
        val dayOffset = ChronoUnit.DAYS.between(startDate, date).toFloat()
        dayOffset to cumulative
    }
}
