package com.tally.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.TrendingDown
import androidx.compose.material.icons.automirrored.filled.TrendingFlat
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarDuration
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.SnackbarResult
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.tally.app.ui.components.AddEntryDialog
import com.tally.app.ui.dashboard.ActivityHeatmap
import com.tally.core.design.TallyMark
import com.tally.core.design.TallySpacing
import com.tally.core.network.Challenge
import com.tally.core.network.ChallengeStats
import com.tally.core.network.Entry
import com.tally.core.network.PaceStatus
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Locale
import kotlinx.coroutines.launch

/**
 * Challenge detail screen showing full challenge information, stats, and entry history.
 * Matches iOS ChallengeDetailView structure.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChallengeDetailScreen(
    challenge: Challenge,
    stats: ChallengeStats?,
    entries: List<Entry>,
    onBack: () -> Unit,
    onSubmitEntry: (challengeId: String, count: Int, sets: List<Int>?, feeling: com.tally.core.network.Feeling?) -> Unit,
    onEditChallenge: (challenge: Challenge) -> Unit,
    onArchiveChallenge: (challengeId: String, archive: Boolean) -> Unit,
    onDeleteChallenge: (challenge: Challenge) -> Unit,
    onDeleteEntry: (entryId: String) -> Unit,
    onRestoreChallenge: (String) -> Unit,
    onRestoreEntry: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var showMenu by remember { mutableStateOf(false) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    var showAddEntryDialog by remember { mutableStateOf(false) }
    
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    
    val numberFormat = NumberFormat.getNumberInstance()
    val tintColor = parseHexColor(challenge.color)
    val totalCount = stats?.totalCount ?: 0
    val progress = if (challenge.target > 0) totalCount.toFloat() / challenge.target.toFloat() else 0f
    
    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text(challenge.name) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showMenu = true }) {
                        Icon(Icons.Default.MoreVert, contentDescription = "More options")
                    }
                    DropdownMenu(
                        expanded = showMenu,
                        onDismissRequest = { showMenu = false }
                    ) {
                        DropdownMenuItem(
                            text = { Text("Edit") },
                            onClick = {
                                showMenu = false
                                onEditChallenge(challenge)
                            }
                        )
                        DropdownMenuItem(
                            text = { Text(if (challenge.isArchived) "Unarchive" else "Archive") },
                            onClick = {
                                showMenu = false
                                onArchiveChallenge(challenge.id, !challenge.isArchived)
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Delete") },
                            onClick = {
                                showMenu = false
                                showDeleteDialog = true
                            }
                        )
                    }
                }
            )
        },
        modifier = modifier
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(TallySpacing.md),
            verticalArrangement = Arrangement.spacedBy(TallySpacing.md)
        ) {
            // Progress Section
            ProgressSection(
                challenge = challenge,
                stats = stats,
                totalCount = totalCount,
                progress = progress,
                tintColor = tintColor,
                onAddEntry = { showAddEntryDialog = true }
            )
            
            // Stats Grid
            stats?.let { statsData ->
                StatsGrid(stats = statsData)
            }
            
            // Activity Heatmap
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surface
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(modifier = Modifier.padding(TallySpacing.md)) {
                    Text(
                        text = "Activity",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    Spacer(modifier = Modifier.height(TallySpacing.sm))
                    ActivityHeatmap(entries = entries)
                }
            }
            
            // Entry History
            EntryHistory(
                entries = entries,
                onDeleteEntry = onDeleteEntry,
                onRestoreEntry = onRestoreEntry,
                snackbarHostState = snackbarHostState,
                scope = scope
            )
        }
    }
    
    // Delete confirmation dialog
    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Challenge") },
            text = { Text("Are you sure you want to delete \"${challenge.name}\"? This action cannot be undone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteDialog = false
                        scope.launch {
                            onDeleteChallenge(challenge)
                            val result = snackbarHostState.showSnackbar(
                                message = "Challenge deleted",
                                actionLabel = "Undo",
                                duration = SnackbarDuration.Short
                            )
                            if (result == SnackbarResult.ActionPerformed) {
                                onRestoreChallenge(challenge.id)
                            }
                        }
                    },
                    colors = ButtonDefaults.textButtonColors(
                        contentColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
    
    // Add entry dialog
    if (showAddEntryDialog) {
        AddEntryDialog(
            challenge = challenge,
            recentEntries = entries.take(10),
            onSubmit = { count, sets, feeling ->
                showAddEntryDialog = false
                onSubmitEntry(challenge.id, count, sets, feeling)
            },
            onDismiss = { showAddEntryDialog = false }
        )
    }
}

@Composable
private fun ProgressSection(
    challenge: Challenge,
    stats: ChallengeStats?,
    totalCount: Int,
    progress: Float,
    tintColor: androidx.compose.ui.graphics.Color,
    onAddEntry: () -> Unit
) {
    val numberFormat = NumberFormat.getNumberInstance()
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(TallySpacing.md),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Challenge icon
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(CircleShape)
                    .background(tintColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = IconMapper.getIcon(challenge.icon),
                    contentDescription = null,
                    tint = tintColor,
                    modifier = Modifier.size(32.dp)
                )
            }
            
            Spacer(modifier = Modifier.height(TallySpacing.md))
            
            // Tally visualization
            TallyMark(
                count = totalCount,
                modifier = Modifier.size(96.dp),
                animated = false
            )
            
            Spacer(modifier = Modifier.height(TallySpacing.md))
            
            // Count text
            Text(
                text = "${numberFormat.format(totalCount)} / ${numberFormat.format(challenge.target)}",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            
            Text(
                text = "${(progress * 100).toInt()}% complete",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(TallySpacing.sm))
            
            // Pace indicator
            stats?.paceStatus?.let { paceStatus ->
                if (paceStatus != PaceStatus.NONE) {
                    PaceIndicator(paceStatus = paceStatus)
                }
            }
            
            Spacer(modifier = Modifier.height(TallySpacing.md))
            
            // Add Entry button
            Button(
                onClick = onAddEntry,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(48.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = tintColor
                )
            ) {
                Text("Add Entry")
            }
            
            Spacer(modifier = Modifier.height(TallySpacing.md))
            
            // Progress bar
            LinearProgressIndicator(
                progress = { progress },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .clip(RoundedCornerShape(4.dp)),
                color = tintColor,
                trackColor = tintColor.copy(alpha = 0.2f),
            )
        }
    }
}

@Composable
private fun PaceIndicator(
    paceStatus: PaceStatus,
    modifier: Modifier = Modifier
) {
    val (icon, text, color) = when (paceStatus) {
        PaceStatus.AHEAD -> Triple(
            Icons.AutoMirrored.Filled.TrendingUp,
            "Ahead of Pace",
            MaterialTheme.colorScheme.primary
        )
        PaceStatus.ON_PACE -> Triple(
            Icons.AutoMirrored.Filled.TrendingFlat,
            "On Pace",
            MaterialTheme.colorScheme.tertiary
        )
        PaceStatus.BEHIND -> Triple(
            Icons.AutoMirrored.Filled.TrendingDown,
            "Behind Pace",
            MaterialTheme.colorScheme.error
        )
        PaceStatus.NONE -> return // Don't show anything
    }
    
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(color.copy(alpha = 0.1f))
            .padding(horizontal = TallySpacing.md, vertical = TallySpacing.sm),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(TallySpacing.xs)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(20.dp),
            tint = color
        )
        Text(
            text = text,
            style = MaterialTheme.typography.labelMedium,
            color = color,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
private fun StatsGrid(stats: ChallengeStats) {
    val numberFormat = NumberFormat.getNumberInstance()
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(TallySpacing.md)) {
            Text(
                text = "Statistics",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(TallySpacing.md))
            
            // 2-column grid
            Column(verticalArrangement = Arrangement.spacedBy(TallySpacing.sm)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(TallySpacing.sm)
                ) {
                    StatItem(
                        label = "Daily Average",
                        value = String.format("%.1f", stats.dailyAverage),
                        modifier = Modifier.weight(1f)
                    )
                    StatItem(
                        label = "Per Day Required",
                        value = String.format("%.1f", stats.perDayRequired),
                        modifier = Modifier.weight(1f)
                    )
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(TallySpacing.sm)
                ) {
                    StatItem(
                        label = "Current Streak",
                        value = numberFormat.format(stats.streakCurrent),
                        modifier = Modifier.weight(1f)
                    )
                    StatItem(
                        label = "Best Streak",
                        value = numberFormat.format(stats.streakBest),
                        modifier = Modifier.weight(1f)
                    )
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(TallySpacing.sm)
                ) {
                    StatItem(
                        label = "Days Elapsed",
                        value = numberFormat.format(stats.daysElapsed),
                        modifier = Modifier.weight(1f)
                    )
                    StatItem(
                        label = "Days Remaining",
                        value = numberFormat.format(stats.daysRemaining),
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        }
    }
}

@Composable
private fun StatItem(
    label: String,
    value: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(TallySpacing.md),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                textAlign = TextAlign.Center
            )
            Spacer(modifier = Modifier.height(TallySpacing.xs))
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun EntryHistory(
    entries: List<Entry>,
    onDeleteEntry: (entryId: String) -> Unit,
    onRestoreEntry: (entryId: String) -> Unit,
    snackbarHostState: SnackbarHostState,
    scope: kotlinx.coroutines.CoroutineScope
) {
    if (entries.isEmpty()) return
    
    val numberFormat = NumberFormat.getNumberInstance()
    val dateFormat = remember { SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()) }
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(TallySpacing.md)) {
            Text(
                text = "Entry History",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
            Spacer(modifier = Modifier.height(TallySpacing.sm))
            
            // Group entries by date and display most recent first
            val sortedEntries = entries.sortedByDescending { it.date }
            
            sortedEntries.forEach { entry ->
                var showDeleteConfirm by remember { mutableStateOf(false) }
                
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = TallySpacing.xs),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
                    )
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(TallySpacing.sm),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = try {
                                    val date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).parse(entry.date)
                                    date?.let { dateFormat.format(it) } ?: entry.date
                                } catch (e: Exception) {
                                    entry.date
                                },
                                style = MaterialTheme.typography.bodyMedium,
                                fontWeight = FontWeight.Medium
                            )
                            
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(TallySpacing.sm),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = numberFormat.format(entry.count),
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                
                                entry.note?.takeIf { it.isNotBlank() }?.let { note ->
                                    Text(
                                        text = "• $note",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }
                        }
                        
                        IconButton(onClick = { showDeleteConfirm = true }) {
                            Icon(
                                Icons.Default.Delete,
                                contentDescription = "Delete entry",
                                tint = MaterialTheme.colorScheme.error
                            )
                        }
                    }
                }
                
                if (showDeleteConfirm) {
                    AlertDialog(
                        onDismissRequest = { showDeleteConfirm = false },
                        title = { Text("Delete Entry") },
                        text = { Text("Are you sure you want to delete this entry?") },
                        confirmButton = {
                            TextButton(
                                onClick = {
                                    showDeleteConfirm = false
                                    scope.launch {
                                        onDeleteEntry(entry.id)
                                        val result = snackbarHostState.showSnackbar(
                                            message = "Entry deleted",
                                            actionLabel = "Undo",
                                            duration = SnackbarDuration.Short
                                        )
                                        if (result == SnackbarResult.ActionPerformed) {
                                            onRestoreEntry(entry.id)
                                        }
                                    }
                                },
                                colors = ButtonDefaults.textButtonColors(
                                    contentColor = MaterialTheme.colorScheme.error
                                )
                            ) {
                                Text("Delete")
                            }
                        },
                        dismissButton = {
                            TextButton(onClick = { showDeleteConfirm = false }) {
                                Text("Cancel")
                            }
                        }
                    )
                }
            }
        }
    }
}
