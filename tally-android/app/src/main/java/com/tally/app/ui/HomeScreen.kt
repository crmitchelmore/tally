package com.tally.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import com.tally.app.R
import com.tally.app.data.ChallengesViewModel
import com.tally.core.design.SyncState
import com.tally.core.design.SyncStatusIndicator
import com.tally.core.design.TallySpacing
import java.time.LocalDate

/**
 * Home screen showing user's challenges with create and add entry functionality.
 */
@Composable
fun HomeScreen(
    viewModel: ChallengesViewModel
) {
    val challengesWithCounts by viewModel.challengesWithCounts.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    val showCreateDialog by viewModel.showCreateDialog.collectAsState()
    val showEntryDialog by viewModel.showEntryDialog.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }

    // Show error in snackbar
    LaunchedEffect(error) {
        error?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearError()
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { viewModel.showCreateDialog() },
                modifier = Modifier.testTag("create_challenge_fab")
            ) {
                Icon(Icons.Default.Add, contentDescription = "Create challenge")
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            Column(
                modifier = Modifier.fillMaxSize()
            ) {
                // Header with sync status
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(TallySpacing.md),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "My Challenges",
                        style = MaterialTheme.typography.headlineSmall,
                        modifier = Modifier.testTag("dashboard_title")
                    )
                    SyncStatusIndicator(state = SyncState.SYNCED)
                }

                when {
                    isLoading && challengesWithCounts.isEmpty() -> {
                        // Initial loading
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
                    }
                    challengesWithCounts.isEmpty() -> {
                        // Empty state
                        EmptyState(
                            onCreateClick = { viewModel.showCreateDialog() }
                        )
                    }
                    else -> {
                        // Challenge list
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxSize()
                                .testTag("challenges_list"),
                            contentPadding = PaddingValues(TallySpacing.md),
                            verticalArrangement = Arrangement.spacedBy(TallySpacing.md)
                        ) {
                            items(
                                items = challengesWithCounts,
                                key = { it.challenge.id }
                            ) { item ->
                                ChallengeCard(
                                    challengeWithCount = item,
                                    onClick = { viewModel.selectChallenge(item.challenge) },
                                    onAddEntry = { viewModel.showEntryDialog(item.challenge) }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Create challenge dialog
    if (showCreateDialog) {
        CreateChallengeDialog(
            onDismiss = { viewModel.hideCreateDialog() },
            onCreate = { name, target, timeframe ->
                viewModel.createChallenge(name, target, timeframe)
            }
        )
    }

    // Add entry dialog
    showEntryDialog?.let { challenge ->
        AddEntryDialog(
            challenge = challenge,
            onDismiss = { viewModel.hideEntryDialog() },
            onSave = { request ->
                viewModel.addEntry(
                    challenge = challenge,
                    count = request.count,
                    date = LocalDate.parse(request.date),
                    note = request.note,
                    feeling = request.feeling
                )
            }
        )
    }
}

@Composable
private fun EmptyState(
    onCreateClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .testTag("empty_state"),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(TallySpacing.md)
        ) {
            Text(
                text = stringResource(R.string.empty_challenges),
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            Button(
                onClick = onCreateClick,
                modifier = Modifier.testTag("create_first_challenge_button")
            ) {
                Text(stringResource(R.string.create_challenge))
            }
        }
    }
}
