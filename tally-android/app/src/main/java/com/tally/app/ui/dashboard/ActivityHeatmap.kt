package com.tally.app.ui.dashboard

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tally.core.design.TallySpacing
import com.tally.core.network.Entry
import java.time.DayOfWeek
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.time.temporal.ChronoUnit

/**
 * GitHub-style activity heatmap showing daily entry counts.
 */
@Composable
fun ActivityHeatmap(
    entries: List<Entry>,
    modifier: Modifier = Modifier
) {
    val today = LocalDate.now()
    val startDate = today.minusMonths(6)
    val weeksCount = ((ChronoUnit.DAYS.between(startDate, today) / 7) + 1).toInt()
    
    // Group entries by date
    val entryCounts = remember(entries) {
        entries.groupBy { it.date }
            .mapValues { (_, v) -> v.sumOf { it.count } }
    }
    
    val maxCount = entryCounts.values.maxOrNull() ?: 0
    val cellSize = 12.dp
    val cellGap = 2.dp
    
    val primaryColor = MaterialTheme.colorScheme.primary
    val surfaceColor = MaterialTheme.colorScheme.surfaceVariant

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
                text = "Activity",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .horizontalScroll(rememberScrollState())
            ) {
                Canvas(
                    modifier = Modifier
                        .width((cellSize + cellGap) * weeksCount)
                        .height((cellSize + cellGap) * 7)
                ) {
                    var currentDate = startDate
                    
                    // Adjust to start on Sunday
                    while (currentDate.dayOfWeek != DayOfWeek.SUNDAY) {
                        currentDate = currentDate.minusDays(1)
                    }
                    
                    for (week in 0 until weeksCount) {
                        for (day in 0 until 7) {
                            if (currentDate.isAfter(today)) break
                            
                            val dateStr = currentDate.format(DateTimeFormatter.ISO_LOCAL_DATE)
                            val count = entryCounts[dateStr] ?: 0
                            
                            val intensity = if (maxCount > 0) {
                                (count.toFloat() / maxCount).coerceIn(0f, 1f)
                            } else 0f
                            
                            val color = if (count > 0) {
                                primaryColor.copy(alpha = 0.2f + (intensity * 0.8f))
                            } else {
                                surfaceColor
                            }
                            
                            val x = week * (cellSize + cellGap).toPx()
                            val y = day * (cellSize + cellGap).toPx()
                            
                            drawRoundRect(
                                color = color,
                                topLeft = Offset(x, y),
                                size = Size(cellSize.toPx(), cellSize.toPx()),
                                cornerRadius = CornerRadius(2.dp.toPx())
                            )
                            
                            currentDate = currentDate.plusDays(1)
                        }
                    }
                }
            }

            // Legend
            Row(
                horizontalArrangement = Arrangement.spacedBy(TallySpacing.xs)
            ) {
                Text(
                    text = "Less",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                for (i in 0..4) {
                    Canvas(modifier = Modifier.height(12.dp).width(12.dp)) {
                        val intensity = i / 4f
                        val color = if (i == 0) {
                            surfaceColor
                        } else {
                            primaryColor.copy(alpha = 0.2f + (intensity * 0.8f))
                        }
                        drawRoundRect(
                            color = color,
                            cornerRadius = CornerRadius(2.dp.toPx())
                        )
                    }
                }
                Text(
                    text = "More",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
