package com.tally.app.ui.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import com.tally.core.design.TallySpacing
import com.tally.core.network.DashboardStats
import com.tally.core.network.PaceStatus
import java.text.NumberFormat

/**
 * Dashboard highlights showing key stats in a compact card layout.
 */
@Composable
fun DashboardHighlights(
    stats: DashboardStats?,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(TallySpacing.md),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            StatItem(
                label = "Today",
                value = stats?.today?.toString() ?: "0"
            )
            StatItem(
                label = "Total",
                value = NumberFormat.getNumberInstance().format(stats?.totalMarks ?: 0)
            )
            StatItem(
                label = "Streak",
                value = "${stats?.bestStreak ?: 0}d"
            )
            StatItem(
                label = "Pace",
                value = stats?.overallPaceStatus?.toDisplayString() ?: "-",
                valueColor = stats?.overallPaceStatus?.toColor()
            )
        }
    }
}

@Composable
private fun StatItem(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    valueColor: androidx.compose.ui.graphics.Color? = null
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = value,
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            color = valueColor ?: MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

private fun PaceStatus.toDisplayString(): String = when (this) {
    PaceStatus.AHEAD -> "Ahead"
    PaceStatus.ON_PACE -> "On Pace"
    PaceStatus.BEHIND -> "Behind"
    PaceStatus.NONE -> "-"
}

@Composable
private fun PaceStatus.toColor(): androidx.compose.ui.graphics.Color = when (this) {
    PaceStatus.AHEAD -> MaterialTheme.colorScheme.primary
    PaceStatus.ON_PACE -> MaterialTheme.colorScheme.tertiary
    PaceStatus.BEHIND -> MaterialTheme.colorScheme.error
    PaceStatus.NONE -> MaterialTheme.colorScheme.onSurfaceVariant
}
