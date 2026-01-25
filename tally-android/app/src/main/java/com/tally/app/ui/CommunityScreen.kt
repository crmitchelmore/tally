package com.tally.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.PersonRemove
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.tally.app.data.ChallengesViewModel
import com.tally.core.design.TallyMark
import com.tally.core.design.TallySpacing
import com.tally.core.design.TallyTheme
import com.tally.core.network.PublicChallenge
import java.text.NumberFormat

/**
 * Community screen showing public challenges with discover and following tabs.
 */
@Composable
fun CommunityScreen(
    viewModel: ChallengesViewModel? = null
) {
    var selectedTab by remember { mutableIntStateOf(0) }
    var searchQuery by remember { mutableStateOf("") }
    
    val publicChallenges by viewModel?.publicChallenges?.collectAsState() ?: remember { mutableStateOf(emptyList()) }
    val followingChallenges by viewModel?.followingChallenges?.collectAsState() ?: remember { mutableStateOf(emptyList()) }
    
    // Refresh community on mount
    LaunchedEffect(Unit) {
        viewModel?.refreshCommunity()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Search bar
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { 
                searchQuery = it
                viewModel?.refreshCommunity(search = it.takeIf { q -> q.isNotBlank() })
            },
            modifier = Modifier
                .fillMaxWidth()
                .padding(TallySpacing.md),
            placeholder = { Text("Search challenges...") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            singleLine = true,
            shape = RoundedCornerShape(12.dp)
        )

        // Tabs
        TabRow(selectedTabIndex = selectedTab) {
            Tab(
                selected = selectedTab == 0,
                onClick = { selectedTab = 0 },
                text = { Text("Discover") }
            )
            Tab(
                selected = selectedTab == 1,
                onClick = { selectedTab = 1 },
                text = { 
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(TallySpacing.xs),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Following")
                        if (followingChallenges.isNotEmpty()) {
                            Badge { Text("${followingChallenges.size}") }
                        }
                    }
                }
            )
        }

        // Content
        when (selectedTab) {
            0 -> ChallengesList(
                challenges = publicChallenges,
                emptyMessage = "No public challenges found",
                onFollow = { viewModel?.followChallenge(it) },
                onUnfollow = { viewModel?.unfollowChallenge(it) }
            )
            1 -> ChallengesList(
                challenges = followingChallenges,
                emptyMessage = "You're not following any challenges yet",
                onFollow = { viewModel?.followChallenge(it) },
                onUnfollow = { viewModel?.unfollowChallenge(it) }
            )
        }
    }
}

@Composable
private fun ChallengesList(
    challenges: List<PublicChallenge>,
    emptyMessage: String,
    onFollow: (String) -> Unit,
    onUnfollow: (String) -> Unit
) {
    if (challenges.isEmpty()) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(TallySpacing.xl),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = emptyMessage,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(TallySpacing.md),
            verticalArrangement = Arrangement.spacedBy(TallySpacing.md)
        ) {
            items(challenges, key = { it.id }) { challenge ->
                PublicChallengeCard(
                    challenge = challenge,
                    onFollow = { onFollow(challenge.id) },
                    onUnfollow = { onUnfollow(challenge.id) }
                )
            }
        }
    }
}

@Composable
private fun PublicChallengeCard(
    challenge: PublicChallenge,
    onFollow: () -> Unit,
    onUnfollow: () -> Unit,
    modifier: Modifier = Modifier
) {
    val numberFormat = NumberFormat.getNumberInstance()
    val tintColor = parseHexColor(challenge.color)
    val isFollowing = challenge.isFollowing ?: false

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(TallySpacing.md)
        ) {
            // Header: Icon + Name + Follow button
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.weight(1f)
                ) {
                    // Challenge icon
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(tintColor.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = IconMapper.getIcon(challenge.icon),
                            contentDescription = null,
                            tint = tintColor,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                    
                    Spacer(modifier = Modifier.width(TallySpacing.sm))
                    
                    Column {
                        Text(
                            text = challenge.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.SemiBold,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        Text(
                            text = "by ${challenge.owner.name}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Follow/Unfollow button
                if (isFollowing) {
                    FilledTonalButton(
                        onClick = onUnfollow,
                        colors = ButtonDefaults.filledTonalButtonColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer
                        )
                    ) {
                        Icon(
                            Icons.Default.PersonRemove,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(TallySpacing.xs))
                        Text("Following")
                    }
                } else {
                    Button(onClick = onFollow) {
                        Icon(
                            Icons.Default.PersonAdd,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(TallySpacing.xs))
                        Text("Follow")
                    }
                }
            }

            Spacer(modifier = Modifier.height(TallySpacing.md))

            // Stats row: Tally + Progress + Followers
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                TallyMark(
                    count = challenge.totalReps,
                    modifier = Modifier.size(48.dp),
                    animated = false
                )

                Spacer(modifier = Modifier.width(TallySpacing.md))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "${numberFormat.format(challenge.totalReps)} / ${numberFormat.format(challenge.target)}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "${(challenge.progress * 100).toInt()}% complete",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Followers count
                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = "${challenge.followerCount}",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        text = "followers",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            Spacer(modifier = Modifier.height(TallySpacing.sm))

            // Progress bar
            LinearProgressIndicator(
                progress = { challenge.progress.toFloat().coerceIn(0f, 1f) },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(6.dp)
                    .clip(RoundedCornerShape(3.dp)),
                color = tintColor,
                trackColor = tintColor.copy(alpha = 0.2f),
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun CommunityScreenPreview() {
    TallyTheme {
        CommunityScreen()
    }
}
