package com.tally.core.design

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.snap
import androidx.compose.animation.core.tween
import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.State
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer

/** Shared short, one-shot motion. Never delays saving or navigation. */
object TallyMotion {
    const val StrokeDurationMs = 120
    const val FeedbackDurationMs = 220
    const val PanelDurationMs = 320
    const val StandardEasing = "cubic-bezier(0.4,0.0,0.2,1.0)"
}

@Composable
fun tallyProgress(target: Float): State<Float> = animateFloatAsState(
    targetValue = target.coerceIn(0f, 1f),
    animationSpec = if (LocalReduceMotion.current) snap() else tween(350, easing = FastOutSlowInEasing),
    label = "Tally progress"
)

/** Reuses the control's interaction source, preserving ripple, focus and semantics. */
@Composable
fun Modifier.tallyPress(source: MutableInteractionSource): Modifier {
    val pressed by source.collectIsPressedAsState()
    val reduceMotion = LocalReduceMotion.current
    val scale = animateFloatAsState(
        targetValue = if (pressed && !reduceMotion) 0.98f else 1f,
        animationSpec = if (reduceMotion) snap() else tween(160, easing = FastOutSlowInEasing),
        label = "Tally press"
    )
    return graphicsLayer { scaleX = scale.value; scaleY = scale.value }
}
