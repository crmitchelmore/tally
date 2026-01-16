package com.tallytracker.android.ui

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.tallytracker.android.ui.challenges.ChallengesScreen
import com.tallytracker.android.ui.community.CommunityScreen
import com.tallytracker.android.ui.leaderboard.LeaderboardScreen
import com.tallytracker.android.ui.settings.SettingsScreen

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    data object Challenges : Screen("challenges", "Challenges", Icons.Default.Home)
    data object Community : Screen("community", "Community", Icons.Default.Person)
    data object Leaderboard : Screen("leaderboard", "Leaderboard", Icons.Default.Star)
    data object Settings : Screen("settings", "Settings", Icons.Default.Settings)
}

@Composable
fun TallyApp() {
    val navController = rememberNavController()
    val items = listOf(
        Screen.Challenges,
        Screen.Community,
        Screen.Leaderboard,
        Screen.Settings
    )

    Scaffold(
        bottomBar = {
            NavigationBar {
                val navBackStackEntry by navController.currentBackStackEntryAsState()
                val currentDestination = navBackStackEntry?.destination
                items.forEach { screen ->
                    NavigationBarItem(
                        icon = { Icon(screen.icon, contentDescription = screen.title) },
                        label = { Text(screen.title) },
                        selected = currentDestination?.hierarchy?.any { it.route == screen.route } == true,
                        onClick = {
                            navController.navigate(screen.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Challenges.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(Screen.Challenges.route) { ChallengesScreen() }
            composable(Screen.Community.route) { CommunityScreen() }
            composable(Screen.Leaderboard.route) { LeaderboardScreen() }
            composable(Screen.Settings.route) { SettingsScreen() }
        }
    }
}
