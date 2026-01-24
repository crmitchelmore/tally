package com.tally.app.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.tally.app.data.ChallengeWithCount
import com.tally.core.design.TallyMark
import com.tally.core.design.TallySpacing
import com.tally.core.network.TimeframeType
import java.text.NumberFormat

/**
 * Card displaying a challenge with progress and tally visualization.
 */
@Composable
fun ChallengeCard(
    challengeWithCount: ChallengeWithCount,
    onClick: () -> Unit,
    onAddEntry: () -> Unit,
    modifier: Modifier = Modifier
) {
    val challenge = challengeWithCount.challenge
    val numberFormat = NumberFormat.getNumberInstance()

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .testTag("challenge_card_${challenge.name}"),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(TallySpacing.md)
        ) {
            // Header row: Name + Add button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = challenge.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = getTimeframeLabel(challenge.timeframeType),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                IconButton(
                    onClick = onAddEntry,
                    modifier = Modifier.testTag("add_entry_${challenge.name}")
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Add entry",
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
            }

            Spacer(modifier = Modifier.height(TallySpacing.md))

            // Tally visualization + counts
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Tally mark
                TallyMark(
                    count = challengeWithCount.totalCount,
                    modifier = Modifier.size(56.dp),
                    animated = false
                )

                Spacer(modifier = Modifier.width(TallySpacing.md))

                // Progress info
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "${numberFormat.format(challengeWithCount.totalCount)} / ${numberFormat.format(challenge.target)}",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "${(challengeWithCount.progress * 100).toInt()}% complete",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(TallySpacing.sm))

            // Progress bar
            LinearProgressIndicator(
                progress = { challengeWithCount.progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp),
                trackColor = MaterialTheme.colorScheme.surfaceVariant,
            )
        }
    }
}

private fun getTimeframeLabel(type: TimeframeType): String {
    return when (type) {
        TimeframeType.YEAR -> "This Year"
        TimeframeType.MONTH -> "This Month"
        TimeframeType.CUSTOM -> "Custom"
    }
}
