package com.tally.app

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.outlined.Group
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.tally.app.data.ChallengesRepository
import com.tally.app.data.ChallengesViewModel
import com.tally.app.ui.CommunityScreen
import com.tally.app.ui.HomeScreen
import com.tally.app.ui.SettingsScreen
import com.tally.core.auth.TallyUser
import com.tally.core.auth.ui.UserProfileButton
import com.tally.core.design.TallyColors
import com.tally.core.network.TallyApiClient
import kotlinx.serialization.Serializable

/**
 * Navigation routes using type-safe Kotlin Serialization.
 */
@Serializable
object HomeRoute

@Serializable
object CommunityRoute

/**
 * Main app composable with bottom navigation.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TallyApp(
    user: TallyUser?,
    onSignOut: () -> Unit,
    apiClient: TallyApiClient? = null
) {
    val navController = rememberNavController()
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }
    var showSettings by remember { mutableStateOf(false) }
    val context = LocalContext.current

    // Create repository and ViewModel
    val isOfflineMode = user == null
    val repository = remember(isOfflineMode) {
        ChallengesRepository(
            context = context,
            apiClient = apiClient,
            isOfflineMode = isOfflineMode
        )
    }
    val challengesViewModel: ChallengesViewModel = viewModel(
        factory = ChallengesViewModel.Factory(repository)
    )

    if (showSettings) {
        ModalBottomSheet(
            onDismissRequest = { showSettings = false }
        ) {
            SettingsScreen(
                onDismiss = { showSettings = false },
                onSignOut = onSignOut,
                viewModel = challengesViewModel
            )
        }
    }

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
                        onClick = { showSettings = true }
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
                            imageVector = if (selectedTab == 1) Icons.Filled.Group else Icons.Outlined.Group,
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
                HomeScreen(viewModel = challengesViewModel)
            }
            composable<CommunityRoute> {
                CommunityScreen(viewModel = challengesViewModel)
            }
        }
    }
}
