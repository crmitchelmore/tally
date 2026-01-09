package app.tally

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import app.tally.auth.AuthTokenStore
import app.tally.auth.SignInOrUpView
import app.tally.model.Challenge
import app.tally.model.Entry
import app.tally.net.CreateChallengeRequest
import app.tally.net.CreateEntryRequest
import app.tally.net.TallyApi
import com.clerk.api.Clerk
import com.clerk.api.network.serialization.onFailure
import com.clerk.api.network.serialization.onSuccess
import com.clerk.api.session.SessionGetTokenOptions
import java.time.LocalDate
import java.util.UUID
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    setContent {
      val viewModel: MainViewModel by viewModels()
      val state by viewModel.uiState.collectAsStateWithLifecycle()

      val scope = rememberCoroutineScope()

      var challenges by remember { mutableStateOf<List<Challenge>>(emptyList()) }
      var entries by remember { mutableStateOf<List<Entry>>(emptyList()) }
      var error by remember { mutableStateOf<String?>(null) }
      var status by remember { mutableStateOf<String?>(null) }

      val tokenStore = remember { AuthTokenStore(this) }

      suspend fun getJwtOrFetch(): String? {
        val session = Clerk.session
        if (session != null) {
          var jwt: String? = null
          session.fetchToken(SessionGetTokenOptions(template = "convex"))
            .onSuccess { jwt = it.jwt }
            .onFailure { /* ignore */ }

          if (!jwt.isNullOrBlank()) {
            withContext(Dispatchers.IO) { tokenStore.setConvexJwt(jwt) }
            return jwt
          }
        }

        return withContext(Dispatchers.IO) { tokenStore.getConvexJwt()?.takeIf { it.isNotBlank() } }
      }

      LaunchedEffect(state) {
        error = null

        if (state != MainUiState.SignedIn) {
          challenges = emptyList()
          entries = emptyList()
          withContext(Dispatchers.IO) { tokenStore.setConvexJwt(null) }
          return@LaunchedEffect
        }

        try {
          val jwt = getJwtOrFetch() ?: run {
            error = "No auth token"
            return@LaunchedEffect
          }

          val loadedChallenges = withContext(Dispatchers.IO) {
            TallyApi.ensureUser(jwt)
            TallyApi.getChallenges(jwt)
          }
          challenges = loadedChallenges

          val first = loadedChallenges.firstOrNull()
          entries = if (first == null) {
            emptyList()
          } else {
            withContext(Dispatchers.IO) { TallyApi.getEntries(jwt, first._id) }
          }
        } catch (e: Exception) {
          error = e.message
        }
      }

      MaterialTheme {
        Column(
          modifier = Modifier.padding(16.dp),
          verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
          Text("Tally (Android)", style = MaterialTheme.typography.titleLarge)

          when (state) {
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
              Button(onClick = { viewModel.signOut() }) { Text("Sign out") }

              Button(onClick = {
                scope.launch {
                  try {
                    status = null
                    error = null

                    val jwt = getJwtOrFetch() ?: run {
                      error = "No auth token"
                      return@launch
                    }

                    val nowYear = LocalDate.now().year.toDouble()
                    val id = withContext(Dispatchers.IO) {
                      TallyApi.createChallenge(
                        jwt,
                        CreateChallengeRequest(
                          name = "Android ${UUID.randomUUID().toString().take(8)}",
                          targetNumber = 10.0,
                          year = nowYear,
                          color = "blue",
                          icon = "🔥",
                          timeframeUnit = "year",
                          isPublic = false,
                        )
                      )
                    }

                    status = "Created challenge: $id"
                    challenges = withContext(Dispatchers.IO) { TallyApi.getChallenges(jwt) }
                  } catch (e: Exception) {
                    error = e.message
                  }
                }
              }) {
                Text("Create challenge")
              }

              Button(onClick = {
                scope.launch {
                  try {
                    status = null
                    error = null

                    val first = challenges.firstOrNull() ?: run {
                      error = "No challenges"
                      return@launch
                    }

                    val jwt = getJwtOrFetch() ?: run {
                      error = "No auth token"
                      return@launch
                    }

                    val date = LocalDate.now().toString()
                    val id = withContext(Dispatchers.IO) {
                      TallyApi.createEntry(jwt, CreateEntryRequest(challengeId = first._id, date = date, count = 1.0))
                    }

                    status = "Added entry: $id"
                    entries = withContext(Dispatchers.IO) { TallyApi.getEntries(jwt, first._id) }
                  } catch (e: Exception) {
                    error = e.message
                  }
                }
              }) {
                Text("Add +1 to first")
              }

              if (status != null) {
                Text(status ?: "")
              }

              if (error != null) {
                Text("Could not load: $error")
              } else {
                Text("My challenges: ${challenges.size}")
                challenges.take(10).forEach { c ->
                  Text("• ${c.name}")
                }

                Text("Entries (first challenge): ${entries.size}")
                entries.take(5).forEach { e ->
                  Text("• ${e.date}: ${e.count}")
                }
              }
            }
          }
        }
      }
    }
  }
}
