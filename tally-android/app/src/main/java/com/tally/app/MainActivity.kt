package com.tally.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.tally.core.design.TallyTheme

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      val viewModel: MainViewModel = viewModel()
      val state by viewModel.uiState.collectAsStateWithLifecycle()
      TallyTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
          Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            when (state) {
              MainUiState.Loading -> CircularProgressIndicator()
              MainUiState.SignedOut -> AuthScreen(onSignedIn = { viewModel.refreshSession() })
              is MainUiState.SignedIn -> {
                LaunchedEffect(Unit) {
                  viewModel.syncQueuedWrites()
                }
                DashboardScreen(state = state, onSignOut = {
                  viewModel.signOut()
                })
              }
            }
          }
        }
      }
    }
  }
}

@Composable
private fun DashboardScreen(state: MainUiState.SignedIn, onSignOut: () -> Unit) {
  Surface(modifier = Modifier.padding(24.dp)) {
    DashboardContent(state = state, onSignOut = onSignOut)
  }
}
