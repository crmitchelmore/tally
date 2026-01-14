package app.tally.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import app.tally.ui.theme.TallyPrimaryButton

@Composable
fun SignInView(viewModel: SignInViewModel = viewModel()) {
  val uiState by viewModel.uiState.collectAsState()
  val isLoading = uiState is SignInViewModel.SignInUiState.Loading

  var email by remember { mutableStateOf("") }
  var password by remember { mutableStateOf("") }

  Column(
    modifier = Modifier.fillMaxWidth(),
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.spacedBy(12.dp),
  ) {
    Text("Sign in", style = MaterialTheme.typography.titleMedium)

    OutlinedTextField(
      value = email,
      onValueChange = { email = it },
      label = { Text("Email") },
      modifier = Modifier.fillMaxWidth(),
      singleLine = true,
      enabled = !isLoading,
    )

    OutlinedTextField(
      value = password,
      onValueChange = { password = it },
      label = { Text("Password") },
      visualTransformation = PasswordVisualTransformation(),
      modifier = Modifier.fillMaxWidth(),
      singleLine = true,
      enabled = !isLoading,
    )

    if (uiState is SignInViewModel.SignInUiState.Error) {
      Text(
        text = (uiState as SignInViewModel.SignInUiState.Error).message,
        color = MaterialTheme.colorScheme.error,
        style = MaterialTheme.typography.bodySmall,
      )
    }

    TallyPrimaryButton(
      text = if (isLoading) "Signing in…" else "Sign in",
      onClick = { viewModel.signIn(email, password) },
      modifier = Modifier.fillMaxWidth(),
      enabled = !isLoading && email.isNotBlank() && password.isNotBlank(),
    )
  }
}
