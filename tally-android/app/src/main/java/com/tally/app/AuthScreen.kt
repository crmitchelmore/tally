package com.tally.app

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.tally.core.design.TallyHeading
import com.tally.core.design.TallySurface
import com.tally.core.design.TallySubtleText

@Composable
fun AuthScreen(onSignedIn: () -> Unit) {
  var isSignUp by remember { mutableStateOf(true) }
  TallySurface {
    Column(
      verticalArrangement = Arrangement.spacedBy(16.dp),
      modifier = Modifier.padding(24.dp)
    ) {
      TallyHeading(if (isSignUp) "Create your account" else "Welcome back")
      TallySubtleText("Keep it simple: email and a password.")
      if (isSignUp) {
        SignUpForm(onSignedIn = onSignedIn)
      } else {
        SignInForm(onSignedIn = onSignedIn)
      }
      Spacer(modifier = Modifier.height(8.dp))
      Button(
        onClick = { isSignUp = !isSignUp },
        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        modifier = Modifier.fillMaxWidth()
      ) {
        Text(if (isSignUp) "I already have an account" else "Create a new account")
      }
    }
  }
}
