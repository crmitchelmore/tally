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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tally.app.BuildConfig
import com.tally.app.R
import com.tally.app.ui.components.AddEntryDialog
import com.tally.core.auth.AuthManager
import com.tally.core.data.ChallengesManager
import com.tally.core.data.SyncState
import com.tally.core.design.SyncStatusIndicator
import com.tally.core.design.TallySpacing
import com.tally.core.design.TallyTheme
import com.tally.core.network.Challenge
import com.tally.core.network.Entry
import com.tally.core.network.TallyApiClient
import kotlinx.coroutines.launch
import java.time.LocalDate

/**
 * Home screen showing user's challenges with optimistic saves.
 * Loads from cache instantly, refreshes in background.
 */
@Composable
fun HomeScreen(authManager: AuthManager? = null) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    
    // Determine if we're in local-only mode (no auth manager = local only)
    val isLocalOnlyMode = authManager == null
    
    // Create API client and manager
    val apiClient = remember(authManager) {
        TallyApiClient(
            baseUrl = BuildConfig.API_BASE_URL,
            getAuthToken = { authManager?.getToken() }
        )
    }
    val challengesManager = remember(apiClient) {
        ChallengesManager.getInstance(context, apiClient)
    }
    
    // Collect state
    val challenges by challengesManager.challenges.collectAsStateWithLifecycle()
    val stats by challengesManager.stats.collectAsStateWithLifecycle()
    val entries by challengesManager.entries.collectAsStateWithLifecycle()
    val isLoading by challengesManager.isLoading.collectAsStateWithLifecycle()
    val isRefreshing by challengesManager.isRefreshing.collectAsStateWithLifecycle()
    val syncState by challengesManager.syncState.collectAsStateWithLifecycle()
    
    // Compute display sync state (local-only mode overrides)
    val displaySyncState = if (isLocalOnlyMode) {
        com.tally.core.design.SyncState.LOCAL_ONLY
    } else {
        when (syncState) {
            SyncState.SYNCED -> com.tally.core.design.SyncState.SYNCED
            SyncState.SYNCING -> com.tally.core.design.SyncState.SYNCING
            SyncState.PENDING -> com.tally.core.design.SyncState.PENDING
            SyncState.FAILED -> com.tally.core.design.SyncState.FAILED
            SyncState.LOCAL_ONLY -> com.tally.core.design.SyncState.LOCAL_ONLY
        }
    }
    
    // Dialog state
    var selectedChallenge by remember { mutableStateOf<Challenge?>(null) }
    var showCreateDialog by remember { mutableStateOf(false) }
    
    // Refresh on mount
    LaunchedEffect(Unit) {
        challengesManager.refreshChallenges()
    }
    
    Scaffold(
        floatingActionButton = {
            // Show FAB when there are challenges
            if (challenges.isNotEmpty()) {
                FloatingActionButton(
                    onClick = { showCreateDialog = true },
                    containerColor = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.testTag("create_challenge_fab")
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = stringResource(R.string.create_challenge)
                    )
                }
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(paddingValues)
                .padding(TallySpacing.md)
                .testTag("dashboard"),
            verticalArrangement = Arrangement.spacedBy(TallySpacing.md)
        ) {
            // Header with sync status
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Tally",
                        style = MaterialTheme.typography.headlineMedium
                    )
                    if (isRefreshing) {
                        Text(
                            text = "Updating...",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                SyncStatusIndicator(
                    state = displaySyncState,
                    modifier = Modifier.testTag("sync_status")
                )
            }

            Spacer(modifier = Modifier.height(TallySpacing.lg))

            when {
                isLoading && challenges.isEmpty() -> {
                    // Show loading only when no cache
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                challenges.isEmpty() -> {
                    // Empty state
                    EmptyState(onCreateClick = { showCreateDialog = true })
                }
                else -> {
                    // Challenge list
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(TallySpacing.md)
                    ) {
                        items(challenges) { challenge ->
                            val challengeStats = stats[challenge.id]
                            val challengeEntries = entries[challenge.id] ?: emptyList()
                            ChallengeCard(
                                challengeWithCount = ChallengeWithCount(
                                    challenge = challenge,
                                    totalCount = challengeStats?.totalCount ?: 0,
                                    stats = challengeStats
                                ),
                                onClick = { selectedChallenge = challenge },
                                onAddEntry = { selectedChallenge = challenge },
                                entries = challengeEntries,
                                showMiniHeatmap = true
                            )
                        }
                    }
                }
            }
        }
    }
    
    // Create challenge dialog
    if (showCreateDialog) {
        CreateChallengeDialog(
            onCreate = { name, target, timeframeType, periodOffset, countType, unitLabel, defaultIncrement, isPublic ->
                scope.launch {
                    challengesManager.createChallenge(
                        name = name,
                        target = target,
                        timeframeType = timeframeType,
                        periodOffset = periodOffset,
                        countType = countType,
                        unitLabel = unitLabel,
                        defaultIncrement = defaultIncrement,
                        isPublic = isPublic
                    )
                }
                showCreateDialog = false
            },
            onDismiss = { showCreateDialog = false }
        )
    }
    
    // Add entry dialog
    selectedChallenge?.let { challenge ->
        val recentEntries = remember(challenge.id) {
            challengesManager.recentEntries(challenge.id)
        }
        
        AddEntryDialog(
            challenge = challenge,
            recentEntries = recentEntries,
            onSubmit = { count, sets, feeling ->
                // Optimistic save - returns immediately
                challengesManager.addEntry(
                    challengeId = challenge.id,
                    count = count,
                    sets = sets,
                    feeling = feeling
                )
                selectedChallenge = null
            },
            onDismiss = { selectedChallenge = null }
        )
    }
}

@Composable
private fun EmptyState(onCreateClick: () -> Unit) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .testTag("empty_state"),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(TallySpacing.sm)
        ) {
            Text(
                text = stringResource(R.string.empty_challenges),
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            Button(
                onClick = onCreateClick,
                modifier = Modifier.testTag("create_challenge_button")
            ) {
                Text(stringResource(R.string.create_challenge))
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun HomeScreenPreview() {
    TallyTheme {
        HomeScreen()
    }
}
