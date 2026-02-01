package com.tally.app.ui.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.width
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.tally.core.network.Entry
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/**
 * Compact mini heatmap showing last 30 days of activity.
 * Optimized for display within challenge cards.
 */
@Composable
fun MiniHeatmap(
    entries: List<Entry>,
    tintColor: Color,
    modifier: Modifier = Modifier,
    daysToShow: Int = 30,
    cellSize: Dp = 8.dp,
    cellGap: Dp = 2.dp
) {
    val today = LocalDate.now()
    val startDate = today.minusDays(daysToShow.toLong() - 1)
    
    // Group entries by date
    val entryCounts = remember(entries) {
        entries.groupBy { it.date }
            .mapValues { (_, v) -> v.sumOf { it.count } }
    }
    
    val maxCount = entryCounts.values.maxOrNull() ?: 1
    val surfaceColor = MaterialTheme.colorScheme.surfaceVariant
    
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(cellGap)
    ) {
        // Show last N days horizontally
        for (i in 0 until daysToShow) {
            val date = startDate.plusDays(i.toLong())
            val dateStr = date.format(DateTimeFormatter.ISO_LOCAL_DATE)
            val count = entryCounts[dateStr] ?: 0
            
            val intensity = if (maxCount > 0) {
                (count.toFloat() / maxCount).coerceIn(0f, 1f)
            } else 0f
            
            val color = if (count > 0) {
                tintColor.copy(alpha = 0.3f + (intensity * 0.7f))
            } else {
                surfaceColor
            }
            
            Canvas(
                modifier = Modifier
                    .width(cellSize)
                    .height(cellSize)
            ) {
                drawRoundRect(
                    color = color,
                    topLeft = Offset.Zero,
                    size = Size(cellSize.toPx(), cellSize.toPx()),
                    cornerRadius = CornerRadius(1.dp.toPx())
                )
            }
        }
    }
}
