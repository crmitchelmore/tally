package com.tally.app.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material.icons.filled.KeyboardArrowUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.tally.core.network.DashboardConfig
import com.tally.core.network.DashboardPanel

/**
 * Dashboard configuration sheet for managing panel visibility and order.
 * Uses visible/hidden panel lists matching iOS implementation.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardConfigSheet(
    config: DashboardConfig,
    onDismiss: () -> Unit,
    onChange: (DashboardConfig) -> Unit
) {
    var localConfig by remember { mutableStateOf(config) }

    // Automatically save changes
    LaunchedEffect(localConfig) {
        onChange(localConfig)
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(24.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // Header
        Text(
            text = "Dashboard Settings",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Visible Panels Section
        Text(
            text = "VISIBLE PANELS",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(8.dp))

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        ) {
            Column(modifier = Modifier.padding(vertical = 8.dp)) {
                if (localConfig.visiblePanels.isEmpty()) {
                    Text(
                        text = "No visible panels",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(16.dp)
                    )
                } else {
                    localConfig.visiblePanels.forEachIndexed { index, panel ->
                        PanelOrderRow(
                            panel = panel,
                            canMoveUp = index > 0,
                            canMoveDown = index < localConfig.visiblePanels.lastIndex,
                            onMoveUp = {
                                localConfig = moveVisiblePanel(localConfig, panel, -1)
                            },
                            onMoveDown = {
                                localConfig = moveVisiblePanel(localConfig, panel, 1)
                            },
                            onHide = {
                                localConfig = hidePanel(localConfig, panel)
                            }
                        )

                        if (index < localConfig.visiblePanels.lastIndex) {
                            HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Hidden Panels Section
        Text(
            text = "HIDDEN PANELS",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        Spacer(modifier = Modifier.height(8.dp))

        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
        ) {
            Column(modifier = Modifier.padding(vertical = 8.dp)) {
                if (localConfig.hiddenPanels.isEmpty()) {
                    Text(
                        text = "No hidden panels",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(16.dp)
                    )
                } else {
                    localConfig.hiddenPanels.forEachIndexed { index, panel ->
                        HiddenPanelRow(
                            panel = panel,
                            onShow = {
                                localConfig = showPanel(localConfig, panel)
                            }
                        )

                        if (index < localConfig.hiddenPanels.lastIndex) {
                            HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Done button
        Button(
            onClick = onDismiss,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Done")
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}

@Composable
private fun PanelOrderRow(
    panel: DashboardPanel,
    canMoveUp: Boolean,
    canMoveDown: Boolean,
    onMoveUp: () -> Unit,
    onMoveDown: () -> Unit,
    onHide: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Panel name - clickable to hide
        Text(
            text = panel.title,
            style = MaterialTheme.typography.bodyLarge,
            modifier = Modifier
                .weight(1f)
                .clickable { onHide() }
        )

        // Move up button
        IconButton(
            onClick = onMoveUp,
            enabled = canMoveUp
        ) {
            Icon(
                imageVector = Icons.Default.KeyboardArrowUp,
                contentDescription = "Move up",
                tint = if (canMoveUp) MaterialTheme.colorScheme.onSurfaceVariant
                       else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.38f)
            )
        }

        // Move down button
        IconButton(
            onClick = onMoveDown,
            enabled = canMoveDown
        ) {
            Icon(
                imageVector = Icons.Default.KeyboardArrowDown,
                contentDescription = "Move down",
                tint = if (canMoveDown) MaterialTheme.colorScheme.onSurfaceVariant
                       else MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.38f)
            )
        }
    }
}

@Composable
private fun HiddenPanelRow(
    panel: DashboardPanel,
    onShow: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onShow() }
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = panel.title,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.weight(1f)
        )

        Text(
            text = "Show",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.primary
        )
    }
}

/**
 * Hide a panel by moving it from visible to hidden list
 */
private fun hidePanel(config: DashboardConfig, panel: DashboardPanel): DashboardConfig {
    val newVisible = config.visiblePanels.toMutableList()
    val newHidden = config.hiddenPanels.toMutableList()
    
    if (newVisible.remove(panel)) {
        newHidden.add(panel)
    }
    
    return config.copy(visiblePanels = newVisible, hiddenPanels = newHidden)
}

/**
 * Show a panel by moving it from hidden to visible list (at end)
 */
private fun showPanel(config: DashboardConfig, panel: DashboardPanel): DashboardConfig {
    val newVisible = config.visiblePanels.toMutableList()
    val newHidden = config.hiddenPanels.toMutableList()
    
    if (newHidden.remove(panel)) {
        newVisible.add(panel)
    }
    
    return config.copy(visiblePanels = newVisible, hiddenPanels = newHidden)
}

/**
 * Move a visible panel up or down in the order list
 * @param direction -1 for up, 1 for down
 */
private fun moveVisiblePanel(config: DashboardConfig, panel: DashboardPanel, direction: Int): DashboardConfig {
    val currentIndex = config.visiblePanels.indexOf(panel)
    
    if (currentIndex == -1) return config
    
    val newIndex = currentIndex + direction
    if (newIndex < 0 || newIndex >= config.visiblePanels.size) return config
    
    val newVisible = config.visiblePanels.toMutableList()
    newVisible.removeAt(currentIndex)
    newVisible.add(newIndex, panel)
    
    return config.copy(visiblePanels = newVisible)
}
