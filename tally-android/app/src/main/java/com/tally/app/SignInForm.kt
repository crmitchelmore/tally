package com.tally.app

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Button
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun SignInForm(onSignedIn: () -> Unit, viewModel: SignInViewModel = viewModel()) {
  val state by viewModel.uiState.collectAsStateWithLifecycle()
  Column {
    OutlinedTextField(
      value = state.email,
      onValueChange = viewModel::updateEmail,
      label = { Text("Email") },
      modifier = Modifier.fillMaxWidth()
    )
    Spacer(modifier = Modifier.height(12.dp))
    OutlinedTextField(
      value = state.password,
      onValueChange = viewModel::updatePassword,
      label = { Text("Password") },
      modifier = Modifier.fillMaxWidth(),
      visualTransformation = PasswordVisualTransformation()
    )
    Spacer(modifier = Modifier.height(16.dp))
    Button(
      onClick = { viewModel.signIn(onSignedIn) },
      modifier = Modifier.fillMaxWidth(),
      enabled = !state.isLoading
    ) {
      Text("Sign in")
    }
    if (state.isLoading) {
      Spacer(modifier = Modifier.height(12.dp))
      LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
    }
    state.error?.let {
      Spacer(modifier = Modifier.height(12.dp))
      Text(it, color = MaterialTheme.colorScheme.error)
    }
  }
}
