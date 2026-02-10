package com.tally.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatDelegate
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.tally.core.auth.AuthManager
import com.tally.core.auth.AuthState
import com.tally.core.auth.ui.AuthErrorScreen
import com.tally.core.auth.ui.LoadingScreen
import com.tally.core.auth.ui.SignInScreen
import com.tally.core.design.TallyTheme
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    private lateinit var authManager: AuthManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        // Restore saved appearance mode
        val prefs = getSharedPreferences("tally_settings", MODE_PRIVATE)
        val savedMode = prefs.getInt("appearance_mode", AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM)
        AppCompatDelegate.setDefaultNightMode(savedMode)

        authManager = AuthManager(
            context = applicationContext,
            publishableKey = BuildConfig.CLERK_PUBLISHABLE_KEY,
            apiBaseUrl = BuildConfig.API_BASE_URL
        )

        setContent {
            TallyTheme {
                val authState by authManager.authState.collectAsStateWithLifecycle()
                val scope = rememberCoroutineScope()

                // Initialize auth on first composition
                LaunchedEffect(Unit) {
                    authManager.initialize()
                }

                when (val state = authState) {
                    is AuthState.Loading -> LoadingScreen()
                    is AuthState.SignedOut -> SignInScreen(
                        onSignIn = { email, password ->
                            authManager.signInWithPassword(email, password)
                        },
                        onContinueWithoutAccount = {
                            authManager.enableLocalOnlyMode()
                        }
                    )
                    is AuthState.OfflineMode -> TallyApp(
                        user = null,
                        authManager = null,
                        onSignOut = {
                            scope.launch {
                                authManager.signOut()
                            }
                        }
                    )
                    is AuthState.SignedIn -> TallyApp(
                        user = state.user,
                        authManager = authManager,
                        onSignOut = {
                            scope.launch {
                                authManager.signOut()
                            }
                        }
                    )
                    is AuthState.Error -> AuthErrorScreen(
                        message = state.message,
                        onRetryClick = {
                            scope.launch {
                                authManager.initialize()
                            }
                        }
                    )
                }
            }
        }
    }
}
