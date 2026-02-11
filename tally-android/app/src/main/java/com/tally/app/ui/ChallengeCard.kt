package com.tally.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Bedtime
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Code
import androidx.compose.material.icons.filled.Coffee
import androidx.compose.material.icons.filled.DirectionsBike
import androidx.compose.material.icons.filled.DirectionsRun
import androidx.compose.material.icons.filled.DirectionsWalk
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.EmojiEvents
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FitnessCenter
import androidx.compose.material.icons.filled.GpsFixed
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.PhotoCamera
import androidx.compose.material.icons.filled.Pool
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.SelfImprovement
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.TrendingDown
import androidx.compose.material.icons.filled.TrendingFlat
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material.icons.filled.WaterDrop
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilledTonalIconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.IconButtonDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.tally.app.data.ChallengeWithCount
import com.tally.app.ui.components.MiniHeatmap
import com.tally.core.design.TallyMark
import com.tally.core.design.TallySpacing
import com.tally.core.network.Entry
import com.tally.core.network.PaceStatus
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
    modifier: Modifier = Modifier,
    entries: List<Entry> = emptyList(), // Optional entries for mini heatmap
    showMiniHeatmap: Boolean = false
) {
    val challenge = challengeWithCount.challenge
    val stats = challengeWithCount.stats
    val numberFormat = NumberFormat.getNumberInstance()
    
    // Parse color from hex
    val tintColor = parseHexColor(challenge.color)

    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .testTag("challenge_card_${challenge.name}"),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(IntrinsicSize.Min)
        ) {
            // Left accent border (4dp colored strip)
            Box(
                modifier = Modifier
                    .width(4.dp)
                    .fillMaxHeight()
                    .background(tintColor)
            )
            
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp)
            ) {
            // Header row: Icon + Name + Badges + Add button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    // Challenge icon — emoji or Material icon
                    val knownIcon = IconMapper.getIconOrNull(challenge.icon)
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(tintColor.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        if (knownIcon != null) {
                            Icon(
                                imageVector = knownIcon,
                                contentDescription = null,
                                tint = tintColor,
                                modifier = Modifier.size(20.dp)
                            )
                        } else {
                            Text(
                                text = challenge.icon,
                                style = MaterialTheme.typography.titleMedium
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.width(TallySpacing.sm))
                    
                    Column {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(TallySpacing.xs)
                        ) {
                            Text(
                                text = challenge.name,
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.SemiBold,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            
                            // Public badge
                            if (challenge.isPublic) {
                                Icon(
                                    imageVector = Icons.Default.Public,
                                    contentDescription = "Public",
                                    modifier = Modifier.size(16.dp),
                                    tint = MaterialTheme.colorScheme.primary
                                )
                            }
                        }
                        
                        Text(
                            text = getTimeframeLabel(challenge.timeframeType),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                FilledTonalIconButton(
                    onClick = onAddEntry,
                    modifier = Modifier.testTag("add_entry_${challenge.name}"),
                    colors = IconButtonDefaults.filledTonalIconButtonColors(
                        containerColor = tintColor.copy(alpha = 0.2f),
                        contentColor = tintColor
                    )
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = "Add entry"
                    )
                }
            }

            Spacer(modifier = Modifier.height(TallySpacing.lg))

            // Tally visualization + counts + pace
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Tally mark - larger size for 1000+ to maintain legibility
                val tallySize = when {
                    challengeWithCount.totalCount >= 1000 -> 72.dp
                    challengeWithCount.totalCount >= 100 -> 64.dp
                    else -> 56.dp
                }
                TallyMark(
                    count = challengeWithCount.totalCount,
                    modifier = Modifier.size(tallySize),
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
                
                // Pace indicator
                stats?.paceStatus?.let { paceStatus ->
                    PaceIndicator(paceStatus = paceStatus)
                }
            }

            Spacer(modifier = Modifier.height(TallySpacing.md))

            // Progress bar with tint color
            LinearProgressIndicator(
                progress = { challengeWithCount.progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(10.dp)
                    .clip(RoundedCornerShape(5.dp)),
                color = tintColor,
                trackColor = tintColor.copy(alpha = 0.2f),
            )
            
            // Sets stats if available
            stats?.let { s ->
                if (challenge.countType?.name == "SETS") {
                    Spacer(modifier = Modifier.height(TallySpacing.sm))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(TallySpacing.md)
                    ) {
                        Text(
                            text = "Best Set: ${s.bestDay?.count ?: "-"}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "Avg: ${String.format("%.1f", s.dailyAverage)}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
            
            // Mini heatmap (optional)
            if (showMiniHeatmap && entries.isNotEmpty()) {
                Spacer(modifier = Modifier.height(TallySpacing.sm))
                MiniHeatmap(
                    entries = entries,
                    tintColor = tintColor,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
        }
    }
}

/**
 * Pace indicator chip showing ahead/behind/on-pace status.
 */
@Composable
private fun PaceIndicator(
    paceStatus: PaceStatus,
    modifier: Modifier = Modifier
) {
    val (icon, text, color) = when (paceStatus) {
        PaceStatus.AHEAD -> Triple(
            Icons.Default.TrendingUp,
            "Ahead",
            MaterialTheme.colorScheme.primary
        )
        PaceStatus.ON_PACE -> Triple(
            Icons.Default.TrendingFlat,
            "On Pace",
            MaterialTheme.colorScheme.tertiary
        )
        PaceStatus.BEHIND -> Triple(
            Icons.Default.TrendingDown,
            "Behind",
            MaterialTheme.colorScheme.error
        )
        PaceStatus.NONE -> return // Don't show anything
    }
    
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(color.copy(alpha = 0.1f))
            .padding(horizontal = TallySpacing.sm, vertical = TallySpacing.xs),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(TallySpacing.xs)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = color
        )
        Text(
            text = text,
            style = MaterialTheme.typography.labelSmall,
            color = color
        )
    }
}

/**
 * Maps web icon names to Material Icons.
 */
object IconMapper {
    private val iconMap: Map<String, ImageVector> = mapOf(
        "star" to Icons.Default.Star,
        "star.fill" to Icons.Default.Star,
        "heart" to Icons.Default.Favorite,
        "heart.fill" to Icons.Default.Favorite,
        "fire" to Icons.Default.LocalFireDepartment,
        "flame" to Icons.Default.LocalFireDepartment,
        "flame.fill" to Icons.Default.LocalFireDepartment,
        "trophy" to Icons.Default.EmojiEvents,
        "trophy.fill" to Icons.Default.EmojiEvents,
        "target" to Icons.Default.GpsFixed,
        "book" to Icons.Default.MenuBook,
        "book.fill" to Icons.Default.MenuBook,
        "dumbbell" to Icons.Default.FitnessCenter,
        "dumbbell.fill" to Icons.Default.FitnessCenter,
        "strength" to Icons.Default.FitnessCenter,
        "running" to Icons.Default.DirectionsRun,
        "figure.run" to Icons.Default.DirectionsRun,
        "bike" to Icons.Default.DirectionsBike,
        "bicycle" to Icons.Default.DirectionsBike,
        "swim" to Icons.Default.Pool,
        "figure.pool.swim" to Icons.Default.Pool,
        "music" to Icons.Default.MusicNote,
        "music.note" to Icons.Default.MusicNote,
        "code" to Icons.Default.Code,
        "paint" to Icons.Default.Palette,
        "paintbrush" to Icons.Default.Palette,
        "paintbrush.fill" to Icons.Default.Palette,
        "camera" to Icons.Default.PhotoCamera,
        "camera.fill" to Icons.Default.PhotoCamera,
        "pen" to Icons.Default.Edit,
        "pencil" to Icons.Default.Edit,
        "coffee" to Icons.Default.Coffee,
        "cup.and.saucer" to Icons.Default.Coffee,
        "cup.and.saucer.fill" to Icons.Default.Coffee,
        "water" to Icons.Default.WaterDrop,
        "drop.fill" to Icons.Default.WaterDrop,
        "meditation" to Icons.Default.SelfImprovement,
        "sleep" to Icons.Default.Bedtime,
        "moon.fill" to Icons.Default.Bedtime,
        "walk" to Icons.Default.DirectionsWalk,
        "figure.walk" to Icons.Default.DirectionsWalk,
        "checkmark" to Icons.Default.Check
    )
    
    fun getIcon(name: String): ImageVector {
        return iconMap[name.lowercase()] ?: Icons.Default.Check
    }
    
    fun getIconOrNull(name: String): ImageVector? {
        return iconMap[name.lowercase()]
    }
}

/**
 * Parse a hex color string to a Compose Color.
 */
fun parseHexColor(hex: String): Color {
    return try {
        val cleanHex = hex.removePrefix("#")
        val colorLong = cleanHex.toLong(16)
        when (cleanHex.length) {
            6 -> Color(0xFF000000 or colorLong)
            8 -> Color(colorLong)
            else -> Color(0xFF4F46E5) // Default indigo
        }
    } catch (e: Exception) {
        Color(0xFF4F46E5) // Default indigo
    }
}

private fun getTimeframeLabel(type: TimeframeType): String {
    return when (type) {
        TimeframeType.YEAR -> "This Year"
        TimeframeType.MONTH -> "This Month"
        TimeframeType.CUSTOM -> "Custom"
    }
}
