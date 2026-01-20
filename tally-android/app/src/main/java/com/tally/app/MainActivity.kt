package com.tally.app

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
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            TallyTheme {
                val authManager = remember {
                    AuthManager(
                        context = applicationContext,
                        publishableKey = BuildConfig.CLERK_PUBLISHABLE_KEY,
                        apiBaseUrl = BuildConfig.API_BASE_URL
                    )
                }

                val authState by authManager.authState.collectAsStateWithLifecycle()
                val scope = rememberCoroutineScope()

                // Initialize auth on first composition
                LaunchedEffect(Unit) {
                    authManager.initialize()
                }

                when (val state = authState) {
                    is AuthState.Loading -> LoadingScreen()
                    is AuthState.SignedOut -> SignInScreen(
                        onSignInClick = {
                            // TODO: Launch Clerk OAuth flow via CustomTabs
                            // For now, show signed-out state (full Clerk SDK integration pending)
                        }
                    )
                    is AuthState.SignedIn -> TallyApp(
                        user = state.user,
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
                                authManager.checkSession()
                            }
                        }
                    )
                }
            }
        }
    }
}
