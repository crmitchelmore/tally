package app.tally

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.tally.auth.SignInOrUpView
import app.tally.model.Challenge
import java.time.LocalDate

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    setContent {
      val authViewModel: MainViewModel by viewModels()
      val authState by authViewModel.uiState.collectAsStateWithLifecycle()

      val tallyViewModel: TallyViewModel by viewModels()
      val ui by tallyViewModel.uiState.collectAsStateWithLifecycle()

      LaunchedEffect(authState) {
        if (authState == MainUiState.SignedIn) {
          tallyViewModel.onSignedIn()
        } else {
          tallyViewModel.onSignedOut()
        }
      }

      val selected: Challenge? = ui.selectedChallengeId
        ?.let { id -> ui.challenges.firstOrNull { it._id == id } }

      MaterialTheme {
        Column(
          modifier = Modifier.padding(16.dp),
          verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
          Text("Tally (Android)", style = MaterialTheme.typography.titleLarge)

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
                Button(onClick = { authViewModel.signOut() }) { Text("Sign out") }
                Spacer(modifier = Modifier.weight(1f))
                if (selected != null) {
                  Button(onClick = { tallyViewModel.backToList() }) { Text("Back") }
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
  Button(onClick = onCreate) {
    Text("New challenge")
  }

  Text("My challenges: ${challenges.size}")

  LazyColumn {
    items(challenges) { c ->
      Column(
        modifier = Modifier
          .fillMaxWidth()
          .clickable { onSelect(c._id) }
          .padding(vertical = 8.dp)
      ) {
        Text(c.name, style = MaterialTheme.typography.titleMedium)
        Text("Target: ${c.targetNumber}", style = MaterialTheme.typography.bodySmall)
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
  Text(challengeName, style = MaterialTheme.typography.titleLarge)

  Button(onClick = onAddEntry) {
    Text("Add entry")
  }

  Text("Entries: $entriesCount")

  LazyColumn {
    items(entries) { e ->
      Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("${e.date}: ${e.count}")
        Spacer(modifier = Modifier.weight(1f))
        TextButton(onClick = { onDeleteEntry(e._id) }) {
          Text("Delete")
        }
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
      Button(
        onClick = {
          val targetNumber = target.toDoubleOrNull() ?: return@Button
          val yearNumber = year.toDoubleOrNull() ?: return@Button
          onCreate(name, targetNumber, yearNumber)
        },
        enabled = name.isNotBlank(),
      ) {
        Text("Create")
      }
    },
    dismissButton = {
      Button(onClick = onDismiss) {
        Text("Cancel")
      }
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
      Button(onClick = {
        val countNumber = count.toDoubleOrNull() ?: return@Button
        onAdd(date, countNumber)
      }) {
        Text("Add")
      }
    },
    dismissButton = {
      Button(onClick = onDismiss) {
        Text("Cancel")
      }
    },
  )
}
