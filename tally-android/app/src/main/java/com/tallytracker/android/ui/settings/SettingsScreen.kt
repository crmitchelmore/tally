package com.tallytracker.android.ui.settings

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.outlined.Launch
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier.fillMaxSize().padding(padding)
        ) {
            // Profile Section
            if (uiState.user != null) {
                ListItem(
                    headlineContent = { Text(uiState.user?.name ?: "User") },
                    supportingContent = { Text(uiState.user?.email ?: "") },
                    leadingContent = {
                        Surface(
                            shape = MaterialTheme.shapes.medium,
                            color = MaterialTheme.colorScheme.primaryContainer,
                            modifier = Modifier.size(48.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Text(
                                    (uiState.user?.name?.firstOrNull() ?: "?").uppercase(),
                                    style = MaterialTheme.typography.titleLarge,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            }
                        }
                    }
                )
                HorizontalDivider()
            }
            
            // Data Section
            ListItem(
                headlineContent = { Text("Export Data") },
                supportingContent = { Text("Download your data as JSON") },
                trailingContent = {
                    Icon(Icons.Outlined.Launch, contentDescription = null)
                },
                modifier = Modifier.fillMaxWidth()
            )
            
            ListItem(
                headlineContent = { Text("Import Data") },
                supportingContent = { Text("Restore from a backup") },
                trailingContent = {
                    Icon(Icons.Outlined.Launch, contentDescription = null)
                },
                modifier = Modifier.fillMaxWidth()
            )
            
            HorizontalDivider()
            
            // About Section
            ListItem(
                headlineContent = { Text("Version") },
                supportingContent = { Text("1.0.0") }
            )
            
            ListItem(
                headlineContent = { Text("Website") },
                trailingContent = {
                    Icon(Icons.Outlined.Launch, contentDescription = null)
                }
            )
            
            HorizontalDivider()
            
            // Sign Out
            ListItem(
                headlineContent = { 
                    Text("Sign Out", color = MaterialTheme.colorScheme.error)
                },
                leadingContent = {
                    Icon(
                        Icons.Default.ExitToApp,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error
                    )
                },
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}
