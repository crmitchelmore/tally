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
fun SignUpView(viewModel: SignUpViewModel = viewModel()) {
  val state by viewModel.uiState.collectAsState()

  Column(
    modifier = Modifier.fillMaxWidth(),
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.spacedBy(12.dp),
  ) {
    Text("Sign up", style = MaterialTheme.typography.titleMedium)

    when (state) {
      is SignUpViewModel.SignUpUiState.NeedsVerification -> {
        var code by remember { mutableStateOf("") }

        OutlinedTextField(
          value = code,
          onValueChange = { code = it },
          label = { Text("Email code") },
          modifier = Modifier.fillMaxWidth(),
          singleLine = true,
        )

        TallyPrimaryButton(
          text = "Verify",
          onClick = { viewModel.verify(code) },
          modifier = Modifier.fillMaxWidth(),
          enabled = code.isNotBlank(),
        )
      }

      else -> {
        var email by remember { mutableStateOf("") }
        var password by remember { mutableStateOf("") }

        OutlinedTextField(
          value = email,
          onValueChange = { email = it },
          label = { Text("Email") },
          modifier = Modifier.fillMaxWidth(),
          singleLine = true,
        )

        OutlinedTextField(
          value = password,
          onValueChange = { password = it },
          label = { Text("Password") },
          visualTransformation = PasswordVisualTransformation(),
          modifier = Modifier.fillMaxWidth(),
          singleLine = true,
        )

        if (state is SignUpViewModel.SignUpUiState.Error) {
          Text(
            text = (state as SignUpViewModel.SignUpUiState.Error).message,
            color = MaterialTheme.colorScheme.error,
            style = MaterialTheme.typography.bodySmall,
          )
        }

        TallyPrimaryButton(
          text = "Sign up",
          onClick = { viewModel.signUp(email, password) },
          modifier = Modifier.fillMaxWidth(),
          enabled = email.isNotBlank() && password.isNotBlank(),
        )
      }
    }
  }
}
