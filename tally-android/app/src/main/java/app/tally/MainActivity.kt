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
import app.tally.net.CreateChallengeRequest
import app.tally.net.CreateEntryRequest
import app.tally.net.TallyApi
import com.clerk.api.Clerk
import com.clerk.api.network.serialization.errorMessage
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
      var error by remember { mutableStateOf<String?>(null) }
      var status by remember { mutableStateOf<String?>(null) }

      val tokenStore = remember { AuthTokenStore(this) }

      LaunchedEffect(state) {
        error = null

        if (state != MainUiState.SignedIn) {
          challenges = emptyList()
          withContext(Dispatchers.IO) { tokenStore.setConvexJwt(null) }
          return@LaunchedEffect
        }

        try {
          val jwt = withContext(Dispatchers.IO) {
            tokenStore.getConvexJwt()?.takeIf { it.isNotBlank() }
          } ?: run {
            val session = Clerk.session
            if (session == null) {
              error = "No Clerk session"
              return@LaunchedEffect
            }

            var jwt: String? = null
            session.fetchToken(SessionGetTokenOptions(template = "convex"))
              .onSuccess { jwt = it.jwt }
              .onFailure { error = it.errorMessage }

            if (jwt.isNullOrBlank()) return@LaunchedEffect

            withContext(Dispatchers.IO) { tokenStore.setConvexJwt(jwt) }
            jwt
          }

          challenges = withContext(Dispatchers.IO) {
            TallyApi.ensureUser(jwt)
            TallyApi.getChallenges(jwt)
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

                    val jwt = withContext(Dispatchers.IO) {
                      tokenStore.getConvexJwt()?.takeIf { it.isNotBlank() }
                    } ?: run {
                      error = "No cached token (sign out/in)"
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

                    val jwt = withContext(Dispatchers.IO) {
                      tokenStore.getConvexJwt()?.takeIf { it.isNotBlank() }
                    } ?: run {
                      error = "No cached token (sign out/in)"
                      return@launch
                    }

                    val date = LocalDate.now().toString()
                    val id = withContext(Dispatchers.IO) {
                      TallyApi.createEntry(jwt, CreateEntryRequest(challengeId = first._id, date = date, count = 1.0))
                    }

                    status = "Added entry: $id"
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
              }
            }
          }
        }
      }
    }
  }
}
