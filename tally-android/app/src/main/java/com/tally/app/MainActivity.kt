package com.tally.app

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
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

        authManager = AuthManager(
            context = applicationContext,
            publishableKey = BuildConfig.CLERK_PUBLISHABLE_KEY,
            apiBaseUrl = BuildConfig.API_BASE_URL
        )

        // Handle auth callback from deep link
        handleIntent(intent)

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
                        onSignInClick = { context ->
                            authManager.launchSignIn(context)
                        },
                        onContinueWithoutAccount = {
                            authManager.enableOfflineMode()
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

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent?) {
        // Handle deep link: tally://auth/callback?token=xxx
        val uri = intent?.data ?: return
        if (uri.scheme == "tally" && uri.host == "auth" && uri.path == "/callback") {
            val token = uri.getQueryParameter("token")
            if (token != null) {
                kotlinx.coroutines.MainScope().launch {
                    authManager.handleAuthCallback(token)
                }
            }
        }
    }
}
