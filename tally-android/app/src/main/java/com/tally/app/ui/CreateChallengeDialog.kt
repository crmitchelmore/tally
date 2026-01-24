package com.tally.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.RadioButton
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
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
import com.tally.core.network.TimeframeType

/**
 * Dialog for creating a new challenge.
 */
@Composable
fun CreateChallengeDialog(
    onDismiss: () -> Unit,
    onCreate: (name: String, target: Int, timeframe: TimeframeType) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var targetStr by remember { mutableStateOf("") }
    var timeframe by remember { mutableStateOf(TimeframeType.YEAR) }

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
                modifier = Modifier.testTag("challenge_form"),
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

                Column(Modifier.selectableGroup()) {
                    TimeframeOption(
                        label = "This Year",
                        selected = timeframe == TimeframeType.YEAR,
                        onClick = { timeframe = TimeframeType.YEAR },
                        testTag = "timeframe_year"
                    )
                    TimeframeOption(
                        label = "This Month",
                        selected = timeframe == TimeframeType.MONTH,
                        onClick = { timeframe = TimeframeType.MONTH },
                        testTag = "timeframe_month"
                    )
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val target = targetStr.toIntOrNull() ?: return@TextButton
                    onCreate(name, target, timeframe)
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

@Composable
private fun TimeframeOption(
    label: String,
    selected: Boolean,
    onClick: () -> Unit,
    testTag: String
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .selectable(
                selected = selected,
                onClick = onClick,
                role = Role.RadioButton
            )
            .padding(vertical = 8.dp)
            .testTag(testTag),
        verticalAlignment = Alignment.CenterVertically
    ) {
        RadioButton(
            selected = selected,
            onClick = null // handled by selectable
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier.padding(start = 8.dp)
        )
    }
}
