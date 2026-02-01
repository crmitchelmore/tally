package com.tally.app.ui

import android.app.Activity
import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Download
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Upload
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tally.app.BuildConfig
import com.tally.app.data.ChallengesViewModel
import com.tally.core.billing.TipJarScreen
import com.tally.core.billing.TipManager
import com.tally.core.design.TallySpacing
import com.tally.core.network.ExportData
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

/** Find Activity from context, traversing ContextWrapper if needed */
private fun Context.findActivity(): Activity? {
    var ctx = this
    while (ctx is ContextWrapper) {
        if (ctx is Activity) return ctx
        ctx = ctx.baseContext
    }
    return null
}

private val json = Json {
    ignoreUnknownKeys = true
    encodeDefaults = true
    prettyPrint = true
}

/**
 * Settings screen with data management, sign out and tip jar options.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onDismiss: () -> Unit,
    onSignOut: () -> Unit,
    viewModel: ChallengesViewModel? = null
) {
    var showTipJar by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf(false) }
    var showDashboardConfig by remember { mutableStateOf(false) }
    var exportResult by remember { mutableStateOf<String?>(null) }
    var importResult by remember { mutableStateOf<String?>(null) }
    
    val context = LocalContext.current
    val tipManager = remember { context.findActivity()?.let { TipManager(it) } }
    
    // File picker for import
    val importLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri ->
        uri?.let {
            try {
                val inputStream = context.contentResolver.openInputStream(it)
                val jsonString = inputStream?.bufferedReader()?.readText()
                inputStream?.close()
                
                if (jsonString != null) {
                    val data = json.decodeFromString<ExportData>(jsonString)
                    viewModel?.importData(data) { success ->
                        importResult = if (success) "Import successful!" else "Import failed"
                    }
                }
            } catch (e: Exception) {
                importResult = "Import failed: ${e.message}"
            }
        }
    }
    
    // Clean up TipManager on dispose
    DisposableEffect(tipManager) {
        onDispose { tipManager?.disconnect() }
    }
    
    if (showTipJar && tipManager != null) {
        ModalBottomSheet(
            onDismissRequest = { 
                showTipJar = false
                tipManager.resetState()
            }
        ) {
            TipJarScreen(tipManager = tipManager)
        }
    }
    
    // Dashboard config sheet
    if (showDashboardConfig && viewModel != null) {
        val dashboardConfig by viewModel.dashboardConfig.collectAsState()
        ModalBottomSheet(
            onDismissRequest = { showDashboardConfig = false }
        ) {
            DashboardConfigSheet(
                config = dashboardConfig,
                onDismiss = { showDashboardConfig = false },
                onChange = { newConfig ->
                    viewModel.updateDashboardConfig(newConfig)
                }
            )
        }
    }
    
    // Delete confirmation dialog
    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Delete All Data?") },
            text = { Text("This will permanently delete all your challenges and entries. This cannot be undone.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel?.deleteAllData { success ->
                            if (success) {
                                showDeleteConfirm = false
                            }
                        }
                    },
                    colors = ButtonDefaults.textButtonColors(
                        contentColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) {
                    Text("Cancel")
                }
            }
        )
    }
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp)
            .verticalScroll(rememberScrollState())
    ) {
        Text(
            text = "Settings",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Dashboard section
        Text(
            text = "DASHBOARD",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        ) {
            Row(
                modifier = Modifier
                    .clickable(enabled = viewModel != null) { showDashboardConfig = true }
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Dashboard,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Configure Panels",
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Text(
                        text = "Customize panel visibility and order",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Data Management section
        Text(
            text = "DATA MANAGEMENT",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        ) {
            Column {
                // Export
                Row(
                    modifier = Modifier
                        .clickable {
                            viewModel?.exportData { data ->
                                if (data != null) {
                                    val jsonString = json.encodeToString(data)
                                    val intent = Intent(Intent.ACTION_SEND).apply {
                                        type = "application/json"
                                        putExtra(Intent.EXTRA_TEXT, jsonString)
                                        putExtra(Intent.EXTRA_SUBJECT, "Tally Export")
                                    }
                                    context.startActivity(Intent.createChooser(intent, "Export Tally Data"))
                                    exportResult = "Export ready to share"
                                } else {
                                    exportResult = "Export failed"
                                }
                            }
                        }
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Upload,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Export Data",
                            style = MaterialTheme.typography.bodyLarge
                        )
                        Text(
                            text = "Save all challenges and entries",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                
                // Import
                Row(
                    modifier = Modifier
                        .clickable { importLauncher.launch("application/json") }
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Download,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Import Data",
                            style = MaterialTheme.typography.bodyLarge
                        )
                        Text(
                            text = "Load from a JSON file",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                
                // Delete all
                Row(
                    modifier = Modifier
                        .clickable { showDeleteConfirm = true }
                        .padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Delete All Data",
                            style = MaterialTheme.typography.bodyLarge,
                            color = MaterialTheme.colorScheme.error
                        )
                        Text(
                            text = "Permanently remove everything",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
        
        // Result messages
        exportResult?.let {
            Spacer(modifier = Modifier.height(TallySpacing.sm))
            Text(
                text = it,
                style = MaterialTheme.typography.bodySmall,
                color = if (it.contains("failed")) MaterialTheme.colorScheme.error 
                        else MaterialTheme.colorScheme.primary
            )
        }
        importResult?.let {
            Spacer(modifier = Modifier.height(TallySpacing.sm))
            Text(
                text = it,
                style = MaterialTheme.typography.bodySmall,
                color = if (it.contains("failed")) MaterialTheme.colorScheme.error 
                        else MaterialTheme.colorScheme.primary
            )
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Support section
        Text(
            text = "SUPPORT",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        ) {
            Row(
                modifier = Modifier
                    .clickable(enabled = tipManager != null) { showTipJar = true }
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Favorite,
                    contentDescription = null,
                    tint = if (tipManager != null) MaterialTheme.colorScheme.primary 
                           else MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Support Development",
                        style = MaterialTheme.typography.bodyLarge,
                        color = if (tipManager != null) LocalContentColor.current
                                else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = if (tipManager != null) "Leave a tip" else "Unavailable",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Account section
        Text(
            text = "ACCOUNT",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.3f)
        ) {
            Row(
                modifier = Modifier
                    .clickable { 
                        onSignOut()
                        onDismiss()
                    }
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.error
                )
                Spacer(modifier = Modifier.width(16.dp))
                Text(
                    text = "Sign Out",
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.error
                )
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Version info
        Text(
            text = "Version ${BuildConfig.VERSION_NAME}",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f),
            modifier = Modifier.align(Alignment.CenterHorizontally)
        )
    }
}
