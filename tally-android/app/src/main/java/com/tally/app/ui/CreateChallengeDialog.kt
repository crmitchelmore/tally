package com.tally.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.SegmentedButton
import androidx.compose.material3.SegmentedButtonDefaults
import androidx.compose.material3.SingleChoiceSegmentedButtonRow
import androidx.compose.material3.Slider
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.tally.app.R
import com.tally.core.design.TallySpacing
import com.tally.core.network.CountType
import com.tally.core.network.TimeframeType

/**
 * Dialog for creating a new challenge.
 */
@Composable
fun CreateChallengeDialog(
    onDismiss: () -> Unit,
    onCreate: (
        name: String,
        target: Int,
        timeframe: TimeframeType,
        periodOffset: Int,
        countType: CountType,
        unitLabel: String?,
        defaultIncrement: Int?,
        isPublic: Boolean
    ) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var targetStr by remember { mutableStateOf("") }
    var timeframe by remember { mutableStateOf(TimeframeType.YEAR) }
    var periodOffset by remember { mutableStateOf(0) } // 0 = this period, 1 = next
    var countType by remember { mutableStateOf(CountType.SIMPLE) }
    var unitLabel by remember { mutableStateOf("") }
    var defaultIncrement by remember { mutableFloatStateOf(1f) }
    var isPublic by remember { mutableStateOf(false) }

    val isValid = name.isNotBlank() && (targetStr.toIntOrNull() ?: 0) > 0

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = stringResource(R.string.create_challenge),
                modifier = Modifier.testTag("create_challenge_title")
            )
        },
        text = {
            Column(
                modifier = Modifier
                    .testTag("challenge_form")
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Name field
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name") },
                    placeholder = { Text("e.g., Push-ups") },
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("challenge_name_input")
                )

                // Target field
                OutlinedTextField(
                    value = targetStr,
                    onValueChange = { targetStr = it.filter { c -> c.isDigit() } },
                    label = { Text("Target") },
                    placeholder = { Text("e.g., 10000") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("challenge_target_input")
                )

                // Timeframe selection
                Text(
                    text = "Timeframe",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                SingleChoiceSegmentedButtonRow(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    SegmentedButton(
                        selected = timeframe == TimeframeType.YEAR,
                        onClick = { 
                            timeframe = TimeframeType.YEAR
                            periodOffset = 0
                        },
                        shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2)
                    ) {
                        Text("Year")
                    }
                    SegmentedButton(
                        selected = timeframe == TimeframeType.MONTH,
                        onClick = { 
                            timeframe = TimeframeType.MONTH
                            periodOffset = 0
                        },
                        shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2)
                    ) {
                        Text("Month")
                    }
                }

                // Period selector (this/next)
                SingleChoiceSegmentedButtonRow(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    val periodLabel = if (timeframe == TimeframeType.YEAR) "year" else "month"
                    SegmentedButton(
                        selected = periodOffset == 0,
                        onClick = { periodOffset = 0 },
                        shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2)
                    ) {
                        Text("This $periodLabel")
                    }
                    SegmentedButton(
                        selected = periodOffset == 1,
                        onClick = { periodOffset = 1 },
                        shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2)
                    ) {
                        Text("Next $periodLabel")
                    }
                }

                // Count type selection
                Text(
                    text = "Tracking Method",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                SingleChoiceSegmentedButtonRow(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    SegmentedButton(
                        selected = countType == CountType.SIMPLE,
                        onClick = { countType = CountType.SIMPLE },
                        shape = SegmentedButtonDefaults.itemShape(index = 0, count = 2)
                    ) {
                        Text("Simple Count")
                    }
                    SegmentedButton(
                        selected = countType == CountType.SETS,
                        onClick = { countType = CountType.SETS },
                        shape = SegmentedButtonDefaults.itemShape(index = 1, count = 2)
                    ) {
                        Text("Sets & Reps")
                    }
                }

                // Unit label (shown for sets mode)
                if (countType == CountType.SETS) {
                    OutlinedTextField(
                        value = unitLabel,
                        onValueChange = { unitLabel = it },
                        label = { Text("Unit Label") },
                        placeholder = { Text("e.g., reps, meters, seconds") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Default increment
                    Column {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Default Value per Set",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "${defaultIncrement.toInt()}",
                                style = MaterialTheme.typography.labelMedium
                            )
                        }
                        Slider(
                            value = defaultIncrement,
                            onValueChange = { defaultIncrement = it },
                            valueRange = 1f..100f,
                            steps = 98,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }

                Spacer(modifier = Modifier.height(TallySpacing.sm))

                // Public toggle
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .selectable(
                            selected = isPublic,
                            onClick = { isPublic = !isPublic },
                            role = Role.Checkbox
                        ),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Checkbox(
                        checked = isPublic,
                        onCheckedChange = null // handled by selectable
                    )
                    Text(
                        text = "Make this challenge public",
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier.padding(start = 8.dp)
                    )
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val target = targetStr.toIntOrNull() ?: return@TextButton
                    onCreate(
                        name,
                        target,
                        timeframe,
                        periodOffset,
                        countType,
                        unitLabel.takeIf { it.isNotBlank() },
                        if (countType == CountType.SETS) defaultIncrement.toInt() else null,
                        isPublic
                    )
                },
                enabled = isValid,
                modifier = Modifier.testTag("save_challenge_button")
            ) {
                Text("Create")
            }
        },
        dismissButton = {
            TextButton(
                onClick = onDismiss,
                modifier = Modifier.testTag("cancel_challenge_button")
            ) {
                Text("Cancel")
            }
        }
    )
}
