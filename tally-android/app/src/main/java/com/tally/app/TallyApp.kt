package com.tally.app

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import com.tally.app.ui.ChallengeDetailScreen
import com.tally.app.ui.CommunityScreen
import com.tally.app.ui.HomeScreen
import com.tally.core.auth.AuthManager
import com.tally.core.auth.TallyUser
import com.tally.core.auth.ui.UserProfileButton
import com.tally.core.data.ChallengesManager
import com.tally.core.design.TallyColors
import com.tally.core.network.TallyApiClient
import kotlinx.coroutines.launch
import kotlinx.serialization.Serializable

/**
 * Navigation routes using type-safe Kotlin Serialization.
 */
@Serializable
object HomeRoute

@Serializable
object CommunityRoute

@Serializable
data class ChallengeDetailRoute(val challengeId: String)

/**
 * Main app composable with bottom navigation.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TallyApp(
    user: TallyUser?,
    authManager: AuthManager?,
    onSignOut: () -> Unit
) {
    val navController = rememberNavController()
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        topBar = {
            TopAppBar(
                title = { Text("Tally") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = TallyColors.paper()
                ),
                actions = {
                    UserProfileButton(
                        user = user,
                        onClick = onSignOut
                    )
                }
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = selectedTab == 0,
                    onClick = {
                        selectedTab = 0
                        navController.navigate(HomeRoute) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    icon = {
                        Icon(
                            imageVector = if (selectedTab == 0) Icons.Filled.Home else Icons.Outlined.Home,
                            contentDescription = null
                        )
                    },
                    label = { Text(stringResource(R.string.tab_home)) }
                )
                NavigationBarItem(
                    selected = selectedTab == 1,
                    onClick = {
                        selectedTab = 1
                        navController.navigate(CommunityRoute) {
                            popUpTo(navController.graph.findStartDestination().id) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    },
                    icon = {
                        Icon(
                            imageVector = if (selectedTab == 1) Icons.Filled.Person else Icons.Outlined.Person,
                            contentDescription = null
                        )
                    },
                    label = { Text(stringResource(R.string.tab_community)) }
                )
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = HomeRoute,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable<HomeRoute> {
                HomeScreen(
                    authManager = authManager,
                    onNavigateToDetail = { challengeId ->
                        navController.navigate(ChallengeDetailRoute(challengeId))
                    }
                )
            }
            composable<CommunityRoute> {
                CommunityScreen()
            }
            composable<ChallengeDetailRoute> { backStackEntry ->
                val route = backStackEntry.toRoute<ChallengeDetailRoute>()
                ChallengeDetailHost(
                    challengeId = route.challengeId,
                    authManager = authManager,
                    onBack = { navController.popBackStack() }
                )
            }
        }
    }
}

/**
 * Host composable that provides data to ChallengeDetailScreen.
 */
@Composable
private fun ChallengeDetailHost(
    challengeId: String,
    authManager: AuthManager?,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val apiClient = remember(authManager) {
        TallyApiClient(
            baseUrl = BuildConfig.API_BASE_URL,
            getAuthToken = { authManager?.getToken() }
        )
    }
    val manager = remember(apiClient) {
        ChallengesManager.getInstance(context, apiClient)
    }

    val challenges by manager.challenges.collectAsStateWithLifecycle()
    val stats by manager.stats.collectAsStateWithLifecycle()

    val challenge = challenges.find { it.id == challengeId }
    val challengeStats = stats[challengeId]
    val entries = remember(challengeId, challenges) {
        manager.recentEntries(challengeId, limit = 100)
    }

    LaunchedEffect(challengeId) {
        manager.refreshChallenges()
    }

    if (challenge != null) {
        ChallengeDetailScreen(
            challenge = challenge,
            stats = challengeStats,
            entries = entries,
            onBack = onBack,
            onSubmitEntry = { challengeId, count, sets, feeling ->
                manager.addEntry(
                    challengeId = challengeId,
                    count = count,
                    sets = sets,
                    feeling = feeling
                )
            },
            onEditChallenge = { /* TODO: edit challenge dialog */ },
            onArchiveChallenge = { id, archive ->
                scope.launch {
                    apiClient.updateChallenge(
                        id,
                        com.tally.core.network.UpdateChallengeRequest(isArchived = archive)
                    )
                    manager.refreshChallenges()
                }
            },
            onDeleteChallenge = { c ->
                scope.launch {
                    apiClient.deleteChallenge(c.id)
                    manager.refreshChallenges()
                    onBack()
                }
            },
            onDeleteEntry = { entryId ->
                scope.launch {
                    apiClient.deleteEntry(entryId)
                    manager.refreshChallenges()
                }
            },
            onRestoreChallenge = { challengeId ->
                scope.launch {
                    apiClient.restoreChallenge(challengeId)
                    manager.refreshChallenges()
                }
            },
            onRestoreEntry = { entryId ->
                scope.launch {
                    apiClient.restoreEntry(entryId)
                    manager.refreshChallenges()
                }
            }
        )
    }
}
