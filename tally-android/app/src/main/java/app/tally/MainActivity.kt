package app.tally

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import app.tally.model.Challenge
import app.tally.net.TallyApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      var challenges by remember { mutableStateOf<List<Challenge>>(emptyList()) }
      var error by remember { mutableStateOf<String?>(null) }

      LaunchedEffect(Unit) {
        try {
          challenges = withContext(Dispatchers.IO) { TallyApi.getPublicChallenges() }
        } catch (e: Exception) {
          error = e.message
        }
      }

      MaterialTheme {
        Column(modifier = Modifier.padding(16.dp)) {
          Text("Tally (Android)", style = MaterialTheme.typography.titleLarge)

          if (error != null) {
            Text("Could not load: $error")
          } else {
            Text("Public challenges: ${challenges.size}")
            challenges.take(10).forEach { c ->
              Text("• ${c.name}")
            }
          }
        }
      }
    }
  }
}
