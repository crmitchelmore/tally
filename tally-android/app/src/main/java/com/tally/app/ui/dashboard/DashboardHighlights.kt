package com.tally.app.ui.dashboard

import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tally.core.design.TallySpacing
import com.tally.core.network.DashboardStats
import com.tally.core.network.PaceStatus
import java.text.NumberFormat

/**
 * Dashboard highlights showing key stats in a 2x2 grid layout.
 */
@Composable
fun DashboardHighlights(
    stats: DashboardStats?,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(TallySpacing.sm)
    ) {
        Text(
            text = "Highlights",
            style = MaterialTheme.typography.titleSmall,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onBackground
        )
        
        // 2x2 Grid
        Column(
            verticalArrangement = Arrangement.spacedBy(TallySpacing.md)
        ) {
            // Row 1: Today + Total
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(TallySpacing.md)
            ) {
                HighlightCard(
                    label = "Today",
                    value = stats?.today?.toString() ?: "0",
                    modifier = Modifier.weight(1f)
                )
                HighlightCard(
                    label = "Total marks",
                    value = NumberFormat.getNumberInstance().format(stats?.totalMarks ?: 0),
                    modifier = Modifier.weight(1f)
                )
            }
            
            // Row 2: Best Streak + Overall Pace
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(TallySpacing.md)
            ) {
                HighlightCard(
                    label = "Best streak",
                    value = "${stats?.bestStreak ?: 0} days",
                    modifier = Modifier.weight(1f)
                )
                HighlightCard(
                    label = "Overall pace",
                    value = stats?.overallPaceStatus?.toDisplayString() ?: "—",
                    valueColor = stats?.overallPaceStatus?.toColor(),
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

/**
 * Individual highlight card with label at top and value below.
 */
@Composable
private fun HighlightCard(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    valueColor: androidx.compose.ui.graphics.Color? = null
) {
    Card(
        modifier = modifier
            .border(
                width = 1.dp,
                color = MaterialTheme.colorScheme.outlineVariant,
                shape = RoundedCornerShape(12.dp)
            ),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(TallySpacing.md),
            verticalArrangement = Arrangement.spacedBy(TallySpacing.xs)
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = valueColor ?: MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

private fun PaceStatus.toDisplayString(): String = when (this) {
    PaceStatus.AHEAD -> "Ahead"
    PaceStatus.ON_PACE -> "On pace"
    PaceStatus.BEHIND -> "Behind"
    PaceStatus.NONE -> "—"
}

@Composable
private fun PaceStatus.toColor(): androidx.compose.ui.graphics.Color = when (this) {
    PaceStatus.AHEAD -> MaterialTheme.colorScheme.primary
    PaceStatus.ON_PACE -> MaterialTheme.colorScheme.tertiary
    PaceStatus.BEHIND -> MaterialTheme.colorScheme.error
    PaceStatus.NONE -> MaterialTheme.colorScheme.onSurfaceVariant
}
