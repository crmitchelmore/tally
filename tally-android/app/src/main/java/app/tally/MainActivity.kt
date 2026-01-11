package app.tally

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.List
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.tally.auth.SignInOrUpView
import app.tally.featureflags.FeatureFlags
import app.tally.model.Challenge
import app.tally.ui.theme.TallyCard
import app.tally.ui.theme.TallyChallengeItem
import app.tally.ui.theme.TallyEmptyState
import app.tally.ui.theme.TallyEntryItem
import app.tally.ui.theme.TallyPrimaryButton
import app.tally.ui.theme.TallySecondaryButton
import app.tally.ui.theme.TallyTheme
import java.time.LocalDate

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    setContent {
      val authViewModel: MainViewModel by viewModels()
      val authState by authViewModel.uiState.collectAsStateWithLifecycle()

      val tallyViewModel: TallyViewModel by viewModels()
      val ui by tallyViewModel.uiState.collectAsStateWithLifecycle()

      // Observe feature flags
      val streaksEnabled by FeatureFlags.streaksEnabled.collectAsStateWithLifecycle()

      LaunchedEffect(authState) {
        if (authState == MainUiState.SignedIn) {
          tallyViewModel.onSignedIn()
        } else {
          tallyViewModel.onSignedOut()
        }
      }

      val selected: Challenge? = ui.selectedChallengeId
        ?.let { id -> ui.challenges.firstOrNull { it._id == id } }

      TallyTheme {
        Column(
          modifier = Modifier.padding(16.dp),
          verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
          Text("Tally (Android)", style = MaterialTheme.typography.titleLarge)

          // Feature flag test indicator
          if (streaksEnabled) {
            AssistChip(
              onClick = { },
              label = { Text("Streaks Feature Enabled") },
              colors = AssistChipDefaults.assistChipColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
              )
            )
          }

          when (authState) {
            MainUiState.MissingConfig -> {
              Text("Missing CLERK_PUBLISHABLE_KEY (set env var at build time)")
            }

            MainUiState.Loading -> {
              Text("Loading…")
            }

            MainUiState.SignedOut -> {
              SignInOrUpView()
            }

            MainUiState.SignedIn -> {
              Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                TallySecondaryButton(
                  text = "Sign out",
                  onClick = { authViewModel.signOut() },
                  modifier = Modifier.semantics { contentDescription = "Sign out button" }
                )
                Spacer(modifier = Modifier.weight(1f))
                if (selected != null) {
                  TallySecondaryButton(
                    text = "Back",
                    onClick = { tallyViewModel.backToList() },
                    modifier = Modifier.semantics { contentDescription = "Back to challenges list" }
                  )
                }
              }

              if (ui.isLoading) {
                Text("Loading…")
              }

              if (ui.status != null) {
                Text(ui.status ?: "")
              }

              if (ui.error != null) {
                Text("Error: ${ui.error}")
              }

              if (selected == null) {
                ChallengesList(
                  challenges = ui.challenges,
                  onSelect = { tallyViewModel.selectChallenge(it) },
                  onCreate = { tallyViewModel.showCreateChallenge(true) },
                )
              } else {
                ChallengeDetail(
                  challengeName = selected.name,
                  entriesCount = ui.entries.size,
                  entries = ui.entries,
                  onAddEntry = { tallyViewModel.showAddEntry(true) },
                  onDeleteEntry = { tallyViewModel.deleteEntry(it) },
                )
              }

              if (ui.showCreateChallenge) {
                CreateChallengeDialog(
                  onDismiss = { tallyViewModel.showCreateChallenge(false) },
                  onCreate = { name, target, year -> tallyViewModel.createChallenge(name = name, targetNumber = target, year = year) },
                )
              }

              if (ui.showAddEntry && selected != null) {
                AddEntryDialog(
                  onDismiss = { tallyViewModel.showAddEntry(false) },
                  onAdd = { date, count -> tallyViewModel.addEntry(date = date, count = count) },
                )
              }
            }
          }
        }
      }
    }
  }
}

@Composable
private fun ChallengesList(
  challenges: List<Challenge>,
  onSelect: (String) -> Unit,
  onCreate: () -> Unit,
) {
  Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
    TallyPrimaryButton(
      text = "New challenge",
      onClick = onCreate,
      icon = Icons.Default.Add,
      modifier = Modifier
        .fillMaxWidth()
        .semantics { contentDescription = "Create new challenge button" }
    )

    if (challenges.isEmpty()) {
      TallyEmptyState(
        icon = Icons.Default.List,
        title = "No challenges yet",
        message = "Create your first challenge to start tracking progress.",
      )
    } else {
      Text(
        "My challenges: ${challenges.size}",
        style = MaterialTheme.typography.labelMedium,
        color = MaterialTheme.colorScheme.onSurfaceVariant,
      )

      LazyColumn(
        verticalArrangement = Arrangement.spacedBy(8.dp),
      ) {
        items(challenges) { c ->
          TallyChallengeItem(
            name = c.name,
            target = c.targetNumber.toInt(),
            onClick = { onSelect(c._id) },
            modifier = Modifier.semantics { contentDescription = "Challenge: ${c.name}, target: ${c.targetNumber.toInt()}" }
          )
        }
      }
    }
  }
}

@Composable
private fun ChallengeDetail(
  challengeName: String,
  entriesCount: Int,
  entries: List<app.tally.model.Entry>,
  onAddEntry: () -> Unit,
  onDeleteEntry: (String) -> Unit,
) {
  val haptic = LocalHapticFeedback.current
  
  Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
    Text(challengeName, style = MaterialTheme.typography.titleLarge)

    TallyPrimaryButton(
      text = "Add entry",
      onClick = {
        haptic.performHapticFeedback(HapticFeedbackType.LongPress)
        onAddEntry()
      },
      icon = Icons.Default.Add,
      modifier = Modifier
        .fillMaxWidth()
        .semantics { contentDescription = "Add entry button" }
    )

    Text(
      "Entries: $entriesCount",
      style = MaterialTheme.typography.labelMedium,
      color = MaterialTheme.colorScheme.onSurfaceVariant,
    )

    LazyColumn(
      verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
      items(entries) { e ->
        TallyEntryItem(
          date = e.date,
          count = e.count.toInt(),
          onDelete = { onDeleteEntry(e._id) },
          modifier = Modifier.semantics { contentDescription = "Entry on ${e.date}: ${e.count.toInt()} marks" }
        )
      }
    }
  }
}

@Composable
private fun CreateChallengeDialog(
  onDismiss: () -> Unit,
  onCreate: (name: String, targetNumber: Double, year: Double) -> Unit,
) {
  var name by rememberSaveable { mutableStateOf("") }
  var target by rememberSaveable { mutableStateOf("10") }
  var year by rememberSaveable { mutableStateOf(LocalDate.now().year.toString()) }
  val haptic = LocalHapticFeedback.current

  AlertDialog(
    onDismissRequest = onDismiss,
    title = { Text("Create challenge") },
    text = {
      Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        OutlinedTextField(value = name, onValueChange = { name = it }, label = { Text("Name") })
        OutlinedTextField(value = target, onValueChange = { target = it }, label = { Text("Target") })
        OutlinedTextField(value = year, onValueChange = { year = it }, label = { Text("Year") })
      }
    },
    confirmButton = {
      TallyPrimaryButton(
        text = "Create",
        onClick = {
          val targetNumber = target.toDoubleOrNull() ?: return@TallyPrimaryButton
          val yearNumber = year.toDoubleOrNull() ?: return@TallyPrimaryButton
          haptic.performHapticFeedback(HapticFeedbackType.LongPress)
          onCreate(name, targetNumber, yearNumber)
        },
        enabled = name.isNotBlank(),
      )
    },
    dismissButton = {
      TallySecondaryButton(
        text = "Cancel",
        onClick = onDismiss
      )
    },
  )
}

@Composable
private fun AddEntryDialog(
  onDismiss: () -> Unit,
  onAdd: (date: String, count: Double) -> Unit,
) {
  var date by rememberSaveable { mutableStateOf(LocalDate.now().toString()) }
  var count by rememberSaveable { mutableStateOf("1") }
  val haptic = LocalHapticFeedback.current

  AlertDialog(
    onDismissRequest = onDismiss,
    title = { Text("Add entry") },
    text = {
      Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        OutlinedTextField(value = date, onValueChange = { date = it }, label = { Text("Date (YYYY-MM-DD)") })
        OutlinedTextField(value = count, onValueChange = { count = it }, label = { Text("Count") })
      }
    },
    confirmButton = {
      TallyPrimaryButton(
        text = "Add",
        onClick = {
          val countNumber = count.toDoubleOrNull() ?: return@TallyPrimaryButton
          haptic.performHapticFeedback(HapticFeedbackType.LongPress)
          onAdd(date, countNumber)
        }
      )
    },
    dismissButton = {
      TallySecondaryButton(
        text = "Cancel",
        onClick = onDismiss
      )
    },
  )
}
