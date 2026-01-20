package com.tally.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Button
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.tally.core.design.TallyHeading
import com.tally.core.auth.SyncState
import com.tally.core.design.TallySubtleText

@Composable
fun DashboardContent(state: MainUiState.SignedIn, onSignOut: () -> Unit) {
  Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
    TallyHeading("Signed in")
    TallySubtleText(state.userLabel)
    SyncStatusRow(state.syncState)
    Spacer(modifier = Modifier.height(8.dp))
    Button(onClick = onSignOut, modifier = Modifier.fillMaxWidth()) {
      Text("Sign out")
    }
  }
}

@Composable
private fun SyncStatusRow(syncState: SyncState) {
  when (syncState) {
    SyncState.Idle -> TallySubtleText("Up to date")
    SyncState.Syncing -> {
      TallySubtleText("Syncing")
      LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
    }
    is SyncState.Error -> TallySubtleText(syncState.message)
  }
}
