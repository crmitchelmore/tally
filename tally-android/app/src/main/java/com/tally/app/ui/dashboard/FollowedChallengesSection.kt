package com.tally.app.ui.dashboard

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import com.tally.core.design.TallySpacing
import com.tally.core.network.PublicChallenge
import java.text.NumberFormat

/**
 * Dashboard section showing challenges the user is following.
 * Displays max 3 challenges with name, owner, follower count, and progress.
 */
@Composable
fun FollowedChallengesSection(
    followedChallenges: List<PublicChallenge>,
    onViewAll: () -> Unit,
    modifier: Modifier = Modifier
) {
    // Don't show if empty
    if (followedChallenges.isEmpty()) return

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
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Following",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold
                )
                TextButton(onClick = onViewAll) {
                    Text("View All")
                }
            }

            Spacer(modifier = Modifier.height(TallySpacing.xs))

            // Challenge list (max 3)
            followedChallenges.take(3).forEach { challenge ->
                FollowedChallengeRow(challenge = challenge)
            }
        }
    }
}

@Composable
private fun FollowedChallengeRow(
    challenge: PublicChallenge,
    modifier: Modifier = Modifier
) {
    val numberFormat = NumberFormat.getNumberInstance()
    val progressPercent = (challenge.progress * 100).toInt()

    Row(
        modifier = modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(TallySpacing.xs)
        ) {
            Text(
                text = challenge.name,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = "by ${challenge.owner.name}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
        }

        Column(
            horizontalAlignment = Alignment.End,
            verticalArrangement = Arrangement.spacedBy(TallySpacing.xs)
        ) {
            Text(
                text = "${numberFormat.format(challenge.followerCount)} followers",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = "$progressPercent% complete",
                style = MaterialTheme.typography.bodySmall,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}
