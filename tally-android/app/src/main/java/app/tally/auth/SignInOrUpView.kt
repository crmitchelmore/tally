package app.tally.auth

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.tally.ui.theme.TallyCard
import app.tally.ui.theme.TallySecondaryButton

@Composable
fun SignInOrUpView() {
  var isSignUp by remember { mutableStateOf(true) }

  Column(
    modifier = Modifier
      .fillMaxSize()
      .padding(16.dp),
    horizontalAlignment = Alignment.CenterHorizontally,
    verticalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterVertically),
  ) {
    Text(
      if (isSignUp) "Create your account" else "Welcome back",
      style = MaterialTheme.typography.titleLarge,
    )

    TallyCard(modifier = Modifier.fillMaxWidth()) {
      if (isSignUp) {
        SignUpView()
      } else {
        SignInView()
      }
    }

    TallySecondaryButton(
      text = if (isSignUp) "Already have an account? Sign in" else "Don't have an account? Sign up",
      onClick = { isSignUp = !isSignUp },
      modifier = Modifier.fillMaxWidth(),
    )
  }
}
