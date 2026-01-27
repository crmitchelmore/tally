package com.tally.core.design

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp

/**
 * Sync state for offline-first behavior.
 */
enum class SyncState {
    SYNCED,
    SYNCING,
    LOCAL_ONLY,
    PENDING,
    FAILED
}

/**
 * Compact sync status indicator showing current sync state.
 */
@Composable
fun SyncStatusIndicator(
    state: SyncState,
    modifier: Modifier = Modifier
) {
    val reduceMotion = LocalReduceMotion.current

    val (text, backgroundColor, textColor) = when (state) {
        SyncState.SYNCED -> Triple("Synced", Color(0xFFE8F5E9), Color(0xFF2E7D32))
        SyncState.SYNCING -> Triple("Syncing…", Color(0xFFFFF8E1), Color(0xFFF57F17))
        SyncState.LOCAL_ONLY -> Triple("Local only", Color(0xFFECEFF1), Color(0xFF546E7A))
        SyncState.PENDING -> Triple("Pending", Color(0xFFFFF3E0), Color(0xFFE65100))
        SyncState.FAILED -> Triple("Sync failed", Color(0xFFFFEBEE), Color(0xFFC62828))
    }

    val description = when (state) {
        SyncState.SYNCED -> "All changes synced"
        SyncState.SYNCING -> "Syncing changes"
        SyncState.LOCAL_ONLY -> "Data stored locally only"
        SyncState.PENDING -> "Changes waiting to sync"
        SyncState.FAILED -> "Sync failed, will retry"
    }

    AnimatedVisibility(
        visible = true,
        enter = if (reduceMotion) fadeIn(initialAlpha = 1f) else fadeIn(),
        exit = if (reduceMotion) fadeOut(targetAlpha = 0f) else fadeOut()
    ) {
        Row(
            modifier = modifier
                .clip(RoundedCornerShape(TallySpacing.sm))
                .background(backgroundColor)
                .padding(horizontal = TallySpacing.sm, vertical = TallySpacing.xs)
                .semantics { contentDescription = description },
            horizontalArrangement = Arrangement.spacedBy(TallySpacing.xs),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = text,
                style = MaterialTheme.typography.labelSmall,
                color = textColor
            )
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun SyncStatusPreview() {
    TallyTheme {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            SyncStatusIndicator(state = SyncState.SYNCED)
            SyncStatusIndicator(state = SyncState.SYNCING)
            SyncStatusIndicator(state = SyncState.LOCAL_ONLY)
        }
    }
}
