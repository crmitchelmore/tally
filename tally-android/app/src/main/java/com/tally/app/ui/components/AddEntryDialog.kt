package com.tally.app.ui.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.tally.core.design.TallyMark
import com.tally.core.design.TallySpacing
import com.tally.core.design.TallyTheme
import com.tally.core.network.Challenge
import com.tally.core.network.CountType
import com.tally.core.network.Entry
import com.tally.core.network.Feeling

/**
 * Dialog for adding entries to a challenge.
 * Supports both simple count and sets-based entry modes.
 * Mirrors iOS AddEntrySheet with optimistic save support.
 */
@Composable
fun AddEntryDialog(
    challenge: Challenge,
    recentEntries: List<Entry>,
    onSubmit: (count: Int, sets: List<Int>?, feeling: Feeling?) -> Unit,
    onDismiss: () -> Unit
) {
    val isSetsBased = challenge.resolvedCountType == CountType.SETS
    
    if (isSetsBased) {
        SetsBasedAddEntryDialog(
            challenge = challenge,
            recentEntries = recentEntries,
            onSubmit = onSubmit,
            onDismiss = onDismiss
        )
    } else {
        SimpleAddEntryDialog(
            challenge = challenge,
            onSubmit = onSubmit,
            onDismiss = onDismiss
        )
    }
}

/**
 * Simple count-based entry dialog with +1/+10/+100 buttons.
 */
@Composable
private fun SimpleAddEntryDialog(
    challenge: Challenge,
    onSubmit: (count: Int, sets: List<Int>?, feeling: Feeling?) -> Unit,
    onDismiss: () -> Unit
) {
    var countStr by remember { mutableStateOf("1") }
    val count = countStr.toIntOrNull() ?: 0
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add to ${challenge.name}") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(TallySpacing.md)
            ) {
                // Tally visualization
                TallyMark(
                    count = count,
                    modifier = Modifier.size(80.dp),
                    animated = true
                )
                
                // Count input
                OutlinedTextField(
                    value = countStr,
                    onValueChange = { countStr = it.filter { c -> c.isDigit() } },
                    label = { Text(challenge.resolvedUnitLabel) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                // Quick adjust buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(TallySpacing.sm)
                ) {
                    // Minus buttons
                    FilledTonalButton(
                        onClick = { 
                            val newCount = maxOf(0, count - 1)
                            countStr = newCount.toString()
                        },
                        enabled = count > 0,
                        modifier = Modifier.weight(1f)
                    ) { Text("-1") }
                    
                    FilledTonalButton(
                        onClick = { 
                            val newCount = maxOf(0, count - 10)
                            countStr = newCount.toString()
                        },
                        enabled = count >= 10,
                        modifier = Modifier.weight(1f)
                    ) { Text("-10") }
                    
                    FilledTonalButton(
                        onClick = { 
                            val newCount = maxOf(0, count - 100)
                            countStr = newCount.toString()
                        },
                        enabled = count >= 100,
                        modifier = Modifier.weight(1f)
                    ) { Text("-100") }
                }
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(TallySpacing.sm)
                ) {
                    // Plus buttons
                    FilledTonalButton(
                        onClick = { countStr = (count + 1).toString() },
                        modifier = Modifier.weight(1f)
                    ) { Text("+1") }
                    
                    FilledTonalButton(
                        onClick = { countStr = (count + 10).toString() },
                        modifier = Modifier.weight(1f)
                    ) { Text("+10") }
                    
                    FilledTonalButton(
                        onClick = { countStr = (count + 100).toString() },
                        modifier = Modifier.weight(1f)
                    ) { Text("+100") }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (count > 0) {
                        onSubmit(count, null, null)
                    }
                },
                enabled = count > 0
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

/**
 * Sets-based entry dialog (e.g., workout sets/reps).
 * First set defaults to average of last 10 days' first sets.
 * Subsequent sets copy previous set's value.
 */
@Composable
private fun SetsBasedAddEntryDialog(
    challenge: Challenge,
    recentEntries: List<Entry>,
    onSubmit: (count: Int, sets: List<Int>?, feeling: Feeling?) -> Unit,
    onDismiss: () -> Unit
) {
    // Calculate average of first set from last 10 days
    val averageFirstSet = remember(recentEntries) {
        val firstSets = recentEntries
            .filter { it.sets?.isNotEmpty() == true }
            .take(10)
            .mapNotNull { it.sets?.firstOrNull() }
        
        if (firstSets.isNotEmpty()) {
            firstSets.average().toInt().coerceAtLeast(1)
        } else {
            10 // Default if no history
        }
    }
    
    val sets = remember { mutableStateListOf(averageFirstSet) }
    val totalCount = sets.sum()
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add to ${challenge.name}") },
        text = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(TallySpacing.md)
            ) {
                // Total visualization
                TallyMark(
                    count = totalCount,
                    modifier = Modifier.size(80.dp),
                    animated = true
                )
                
                Text(
                    text = "Total: $totalCount ${challenge.resolvedUnitLabel}",
                    style = MaterialTheme.typography.titleMedium
                )
                
                Spacer(modifier = Modifier.height(TallySpacing.sm))
                
                // Sets list
                sets.forEachIndexed { index, setCount ->
                    SetRow(
                        setNumber = index + 1,
                        count = setCount,
                        onCountChange = { sets[index] = it },
                        onDelete = if (sets.size > 1) {{ sets.removeAt(index) }} else null
                    )
                }
                
                // Add set button
                OutlinedButton(
                    onClick = {
                        // New set copies previous set's value
                        val newValue = sets.lastOrNull() ?: averageFirstSet
                        sets.add(newValue)
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Spacer(modifier = Modifier.width(TallySpacing.sm))
                    Text("Add Set")
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (totalCount > 0) {
                        onSubmit(totalCount, sets.toList(), null)
                    }
                },
                enabled = totalCount > 0
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

/**
 * Individual set row with stepper controls.
 */
@Composable
private fun SetRow(
    setNumber: Int,
    count: Int,
    onCountChange: (Int) -> Unit,
    onDelete: (() -> Unit)?
) {
    var countStr by remember(count) { mutableStateOf(count.toString()) }
    
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(TallySpacing.sm)
    ) {
        Text(
            text = "Set $setNumber",
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.width(56.dp)
        )
        
        // Stepper
        Row(
            modifier = Modifier.weight(1f),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            IconButton(
                onClick = {
                    val newCount = maxOf(0, count - 1)
                    countStr = newCount.toString()
                    onCountChange(newCount)
                },
                enabled = count > 0
            ) {
                Icon(Icons.Default.KeyboardArrowDown, contentDescription = "Decrease")
            }
            
            OutlinedTextField(
                value = countStr,
                onValueChange = { 
                    countStr = it.filter { c -> c.isDigit() }
                    countStr.toIntOrNull()?.let { newCount ->
                        onCountChange(newCount)
                    }
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.width(80.dp),
                singleLine = true
            )
            
            IconButton(
                onClick = {
                    val newCount = count + 1
                    countStr = newCount.toString()
                    onCountChange(newCount)
                }
            ) {
                Icon(Icons.Default.Add, contentDescription = "Increase")
            }
        }
        
        // Delete button
        if (onDelete != null) {
            IconButton(onClick = onDelete) {
                Icon(
                    Icons.Default.Close,
                    contentDescription = "Remove set",
                    tint = MaterialTheme.colorScheme.error
                )
            }
        } else {
            Spacer(modifier = Modifier.size(48.dp))
        }
    }
}

@Preview
@Composable
private fun SimpleAddEntryDialogPreview() {
    TallyTheme {
        SimpleAddEntryDialog(
            challenge = previewChallenge,
            onSubmit = { _, _, _ -> },
            onDismiss = {}
        )
    }
}

@Preview
@Composable
private fun SetsBasedAddEntryDialogPreview() {
    TallyTheme {
        SetsBasedAddEntryDialog(
            challenge = previewChallenge.copy(countType = CountType.SETS),
            recentEntries = emptyList(),
            onSubmit = { _, _, _ -> },
            onDismiss = {}
        )
    }
}

private val previewChallenge = Challenge(
    id = "1",
    userId = "user1",
    name = "Push-ups",
    target = 10000,
    timeframeType = com.tally.core.network.TimeframeType.YEAR,
    startDate = "2025-01-01",
    endDate = "2025-12-31",
    color = "#FF5733",
    icon = "💪",
    isPublic = false,
    isArchived = false,
    countType = CountType.SIMPLE,
    unitLabel = "reps",
    defaultIncrement = 1,
    createdAt = "2025-01-01T00:00:00Z",
    updatedAt = "2025-01-01T00:00:00Z"
)
