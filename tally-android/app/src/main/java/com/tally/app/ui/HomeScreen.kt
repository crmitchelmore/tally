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
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.tally.app.R
import com.tally.core.design.SyncState
import com.tally.core.design.SyncStatusIndicator
import com.tally.core.design.TallyMark
import com.tally.core.design.TallySpacing
import com.tally.core.design.TallyTheme

/**
 * Home screen showing user's challenges and interactive tally demo.
 */
@Composable
fun HomeScreen() {
    var count by remember { mutableIntStateOf(0) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(TallySpacing.md),
        verticalArrangement = Arrangement.spacedBy(TallySpacing.md)
    ) {
        // Header with sync status
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Tally",
                style = MaterialTheme.typography.headlineMedium
            )
            SyncStatusIndicator(state = SyncState.SYNCED)
        }

        Spacer(modifier = Modifier.height(TallySpacing.lg))

        // Interactive demo card
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(TallySpacing.lg),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(TallySpacing.md)
            ) {
                Text(
                    text = "Demo Counter",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                // Tally mark visualization
                TallyMark(
                    count = count,
                    modifier = Modifier.size(120.dp),
                    animated = true
                )

                // Count display
                Text(
                    text = count.toString(),
                    style = MaterialTheme.typography.displayMedium
                )

                // Controls
                Row(
                    horizontalArrangement = Arrangement.spacedBy(TallySpacing.md)
                ) {
                    Button(
                        onClick = { if (count > 0) count-- },
                        enabled = count > 0
                    ) {
                        Text("-1")
                    }
                    Button(
                        onClick = { count++ }
                    ) {
                        Text("+1")
                    }
                    Button(
                        onClick = { count += 5 }
                    ) {
                        Text("+5")
                    }
                }

                Button(
                    onClick = { count = 0 },
                    enabled = count > 0
                ) {
                    Text("Reset")
                }
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        // Empty state for challenges
        Box(
            modifier = Modifier.fillMaxWidth(),
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
                Button(onClick = { /* TODO: Create challenge flow */ }) {
                    Text(stringResource(R.string.create_challenge))
                }
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
