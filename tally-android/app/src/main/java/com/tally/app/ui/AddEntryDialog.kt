package com.tally.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.tally.core.design.TallyMark
import com.tally.core.design.TallySpacing
import com.tally.core.design.TallyTheme
import com.tally.core.network.Challenge
import com.tally.core.network.CreateEntryRequest
import com.tally.core.network.Feeling
import java.time.LocalDate
import java.time.format.DateTimeFormatter

/**
 * Dialog for adding an entry to a challenge.
 * Supports count input, date selection, optional note, and feeling selector.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEntryDialog(
    challenge: Challenge,
    onDismiss: () -> Unit,
    onSave: (CreateEntryRequest) -> Unit,
    isSaving: Boolean = false,
    errorMessage: String? = null
) {
    var count by remember { mutableIntStateOf(1) }
    var countText by remember { mutableStateOf("1") }
    var selectedDate by remember { mutableStateOf(LocalDate.now()) }
    var note by remember { mutableStateOf("") }
    var selectedFeeling by remember { mutableStateOf<Feeling?>(null) }
    var showDatePicker by remember { mutableStateOf(false) }

    val dateFormatter = DateTimeFormatter.ISO_LOCAL_DATE

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        modifier = Modifier.testTag("addEntryDialog")
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = TallySpacing.lg)
                .padding(bottom = TallySpacing.xl)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(TallySpacing.lg)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Add Entry",
                    style = MaterialTheme.typography.headlineSmall
                )
                IconButton(onClick = onDismiss) {
                    Icon(Icons.Default.Close, contentDescription = "Close")
                }
            }

            // Tally preview
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(TallySpacing.lg),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(TallySpacing.md)
                ) {
                    TallyMark(
                        count = count,
                        modifier = Modifier.size(80.dp),
                        animated = true
                    )
                    Text(
                        text = "$count ${challenge.unitLabel ?: "reps"}",
                        style = MaterialTheme.typography.headlineMedium
                    )
                }
            }

            // Count input with increment/decrement
            Column(verticalArrangement = Arrangement.spacedBy(TallySpacing.sm)) {
                Text(
                    text = "Count",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.Center,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    FilledIconButton(
                        onClick = { if (count > 1) { count--; countText = count.toString() } },
                        enabled = count > 1,
                        modifier = Modifier
                            .size(56.dp)
                            .testTag("decrementButton")
                    ) {
                        Icon(Icons.Default.Remove, contentDescription = "Decrease")
                    }
                    
                    OutlinedTextField(
                        value = countText,
                        onValueChange = { newValue ->
                            countText = newValue
                            newValue.toIntOrNull()?.let { if (it >= 1) count = it }
                        },
                        modifier = Modifier
                            .width(100.dp)
                            .padding(horizontal = TallySpacing.md)
                            .testTag("countInput"),
                        textStyle = MaterialTheme.typography.headlineMedium.copy(
                            textAlign = TextAlign.Center
                        ),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true
                    )
                    
                    FilledIconButton(
                        onClick = { count++; countText = count.toString() },
                        modifier = Modifier
                            .size(56.dp)
                            .testTag("incrementButton")
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Increase")
                    }
                }
            }

            // Quick add buttons
            Column(verticalArrangement = Arrangement.spacedBy(TallySpacing.sm)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(TallySpacing.sm)
                ) {
                    QuickButton("+1", Modifier.weight(1f)) { count += 1; countText = count.toString() }
                    QuickButton("+10", Modifier.weight(1f)) { count += 10; countText = count.toString() }
                    QuickButton("+100", Modifier.weight(1f)) { count += 100; countText = count.toString() }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(TallySpacing.sm)
                ) {
                    QuickButton("-1", Modifier.weight(1f), enabled = count > 1) { 
                        count = maxOf(1, count - 1); countText = count.toString() 
                    }
                    QuickButton("-10", Modifier.weight(1f), enabled = count > 10) { 
                        count = maxOf(1, count - 10); countText = count.toString() 
                    }
                    QuickButton("-100", Modifier.weight(1f), enabled = count > 100) { 
                        count = maxOf(1, count - 100); countText = count.toString() 
                    }
                }
            }

            // Date picker
            Column(verticalArrangement = Arrangement.spacedBy(TallySpacing.sm)) {
                Text(
                    text = "Date",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                OutlinedButton(
                    onClick = { showDatePicker = true },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("datePicker")
                ) {
                    Text(selectedDate.format(DateTimeFormatter.ofPattern("MMM d, yyyy")))
                }
            }

            // Feeling selector
            Column(verticalArrangement = Arrangement.spacedBy(TallySpacing.sm)) {
                Text(
                    text = "How did it feel?",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(TallySpacing.sm)
                ) {
                    FeelingButton(
                        feeling = Feeling.GREAT,
                        emoji = "🔥",
                        label = "Great",
                        selected = selectedFeeling == Feeling.GREAT,
                        modifier = Modifier.weight(1f)
                    ) { selectedFeeling = if (selectedFeeling == Feeling.GREAT) null else Feeling.GREAT }
                    
                    FeelingButton(
                        feeling = Feeling.GOOD,
                        emoji = "😊",
                        label = "Good",
                        selected = selectedFeeling == Feeling.GOOD,
                        modifier = Modifier.weight(1f)
                    ) { selectedFeeling = if (selectedFeeling == Feeling.GOOD) null else Feeling.GOOD }
                    
                    FeelingButton(
                        feeling = Feeling.OKAY,
                        emoji = "😐",
                        label = "Okay",
                        selected = selectedFeeling == Feeling.OKAY,
                        modifier = Modifier.weight(1f)
                    ) { selectedFeeling = if (selectedFeeling == Feeling.OKAY) null else Feeling.OKAY }
                    
                    FeelingButton(
                        feeling = Feeling.TOUGH,
                        emoji = "😤",
                        label = "Tough",
                        selected = selectedFeeling == Feeling.TOUGH,
                        modifier = Modifier.weight(1f)
                    ) { selectedFeeling = if (selectedFeeling == Feeling.TOUGH) null else Feeling.TOUGH }
                }
            }

            // Note input
            Column(verticalArrangement = Arrangement.spacedBy(TallySpacing.sm)) {
                Text(
                    text = "Note (optional)",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                OutlinedTextField(
                    value = note,
                    onValueChange = { note = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("noteInput"),
                    placeholder = { Text("Add a note...") },
                    minLines = 2,
                    maxLines = 4
                )
            }

            // Error message
            errorMessage?.let { error ->
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }

            // Save button
            Button(
                onClick = {
                    val request = CreateEntryRequest(
                        challengeId = challenge.id,
                        date = selectedDate.format(dateFormatter),
                        count = count,
                        note = note.takeIf { it.isNotBlank() },
                        feeling = selectedFeeling
                    )
                    onSave(request)
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .testTag("saveButton"),
                enabled = !isSaving && count >= 1
            ) {
                if (isSaving) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Save Entry", style = MaterialTheme.typography.titleMedium)
                }
            }

            Spacer(modifier = Modifier.height(TallySpacing.md))
        }
    }

    // Date picker dialog
    if (showDatePicker) {
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = selectedDate.toEpochDay() * 24 * 60 * 60 * 1000,
            selectableDates = object : SelectableDates {
                override fun isSelectableDate(utcTimeMillis: Long): Boolean {
                    return utcTimeMillis <= System.currentTimeMillis()
                }
            }
        )
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(
                    onClick = {
                        datePickerState.selectedDateMillis?.let { millis ->
                            selectedDate = LocalDate.ofEpochDay(millis / (24 * 60 * 60 * 1000))
                        }
                        showDatePicker = false
                    }
                ) {
                    Text("OK")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Cancel")
                }
            }
        ) {
            DatePicker(state = datePickerState)
        }
    }
}

@Composable
private fun QuickButton(
    text: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    onClick: () -> Unit
) {
    FilledTonalButton(
        onClick = onClick,
        modifier = modifier,
        enabled = enabled,
        contentPadding = PaddingValues(vertical = TallySpacing.sm)
    ) {
        Text(text, style = MaterialTheme.typography.labelLarge)
    }
}

@Composable
private fun FeelingButton(
    feeling: Feeling,
    emoji: String,
    label: String,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    val backgroundColor = if (selected) {
        MaterialTheme.colorScheme.primaryContainer
    } else {
        MaterialTheme.colorScheme.surfaceVariant
    }
    val borderColor = if (selected) {
        MaterialTheme.colorScheme.primary
    } else {
        MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
    }

    Column(
        modifier = modifier
            .clip(RoundedCornerShape(12.dp))
            .background(backgroundColor)
            .border(2.dp, borderColor, RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(vertical = TallySpacing.sm)
            .testTag("feeling${feeling.name.lowercase().replaceFirstChar { it.uppercase() }}"),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Text(emoji, style = MaterialTheme.typography.headlineSmall)
        Text(
            label,
            style = MaterialTheme.typography.labelSmall,
            color = if (selected) {
                MaterialTheme.colorScheme.onPrimaryContainer
            } else {
                MaterialTheme.colorScheme.onSurfaceVariant
            }
        )
    }
}

@Preview
@Composable
private fun AddEntryDialogPreview() {
    TallyTheme {
        // Preview not shown for ModalBottomSheet
    }
}
