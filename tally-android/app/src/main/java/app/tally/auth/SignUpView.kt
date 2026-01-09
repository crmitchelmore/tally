package app.tally.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun SignUpView(viewModel: SignUpViewModel = viewModel()) {
  val state by viewModel.uiState.collectAsState()

  Column(
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
  ) {
    Text("Sign Up")

    when (state) {
      is SignUpViewModel.SignUpUiState.NeedsVerification -> {
        var code by remember { mutableStateOf("") }
        TextField(value = code, onValueChange = { code = it }, placeholder = { Text("Email code") })
        Button(onClick = { viewModel.verify(code) }) { Text("Verify") }
      }

      else -> {
        var email by remember { mutableStateOf("") }
        var password by remember { mutableStateOf("") }

        TextField(value = email, onValueChange = { email = it }, placeholder = { Text("Email") })
        TextField(
          value = password,
          onValueChange = { password = it },
          placeholder = { Text("Password") },
          visualTransformation = PasswordVisualTransformation(),
        )

        Button(onClick = { viewModel.signUp(email, password) }) { Text("Sign Up") }
      }
    }
  }
}
