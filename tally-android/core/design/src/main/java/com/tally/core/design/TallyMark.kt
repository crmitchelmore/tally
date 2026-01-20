package com.tally.core.design

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.translate
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Fractal completion tally mark component.
 *
 * Renders counts 1-10,000+ using the hierarchical tally system:
 * - 1-4: vertical strokes
 * - 5: 5-gate (4 strokes + diagonal slash)
 * - 6-24: multiple 5-gates in X layout
 * - 25: full 25-unit with C2 X overlay
 * - 26-99: 2x2 grid of 25-units
 * - 100: X + square outline (C3)
 * - 101-999: row of 100-blocks
 * - 1000+: rows with horizontal line overlay
 *
 * @param count The number to display (1-10,000+)
 * @param modifier Modifier for sizing/positioning
 * @param animated Whether to animate stroke drawing
 * @param size Size of the component
 */
@Composable
fun TallyMark(
    count: Int,
    modifier: Modifier = Modifier,
    animated: Boolean = false,
    size: Dp = 64.dp
) {
    val reduceMotion = LocalReduceMotion.current
    val shouldAnimate = animated && !reduceMotion

    // Animation progress (0 to 1)
    val progress = remember { Animatable(if (shouldAnimate) 0f else 1f) }

    LaunchedEffect(count, shouldAnimate) {
        if (shouldAnimate) {
            progress.snapTo(0f)
            progress.animateTo(
                targetValue = 1f,
                animationSpec = tween(durationMillis = TallyMotion.StrokeDurationMs * 3)
            )
        } else {
            progress.snapTo(1f)
        }
    }

    val isDark = isSystemInDarkTheme()
    val c1 = if (isDark) TallyColors.InkC1Dark else TallyColors.InkC1Light
    val c2 = if (isDark) TallyColors.InkC2Dark else TallyColors.InkC2Light
    val c3 = if (isDark) TallyColors.InkC3Dark else TallyColors.InkC3Light
    val accent = if (isDark) TallyColors.AccentDark else TallyColors.AccentLight

    // Accessibility description
    val description = buildTallyDescription(count)

    Canvas(
        modifier = modifier
            .size(size)
            .semantics { contentDescription = description }
    ) {
        val drawProgress = progress.value
        drawTally(count, c1, c2, c3, accent, drawProgress)
    }
}

/**
 * Builds an accessibility description for the tally count.
 */
private fun buildTallyDescription(count: Int): String {
    if (count <= 0) return "No marks"
    if (count == 1) return "1 mark"

    val fiveGates = count / 5
    val singles = count % 5

    return buildString {
        append("$count marks")
        if (fiveGates > 0 || singles > 0) {
            append(": ")
            if (fiveGates == 1) {
                append("one five-gate")
            } else if (fiveGates > 1) {
                append("$fiveGates five-gates")
            }
            if (fiveGates > 0 && singles > 0) {
                append(", ")
            }
            if (singles == 1) {
                append("one stroke")
            } else if (singles > 1) {
                append("$singles strokes")
            }
        }
    }
}

/**
 * Main drawing function for tally marks.
 */
private fun DrawScope.drawTally(
    count: Int,
    c1: Color,
    c2: Color,
    c3: Color,
    accent: Color,
    progress: Float
) {
    val w = size.width
    val h = size.height
    val strokeWidth = w * 0.04f

    when {
        count <= 0 -> { /* Draw nothing */ }
        count <= 4 -> drawStrokes(count, c1, strokeWidth, progress)
        count == 5 -> drawFiveGate(c1, accent, strokeWidth, progress)
        count <= 24 -> drawMultipleFiveGates(count, c1, accent, strokeWidth, progress)
        count == 25 -> drawTwentyFiveUnit(c1, c2, accent, strokeWidth, progress, showOverlay = true)
        count <= 99 -> draw26To99(count, c1, c2, accent, strokeWidth, progress)
        count == 100 -> draw100Cap(c2, c3, strokeWidth)
        count <= 999 -> draw101To999(count, c1, c2, c3, accent, strokeWidth, progress)
        count == 1000 -> draw1000Cap(c3, c1, strokeWidth)
        count <= 9999 -> draw1001To9999(count, c1, c2, c3, accent, strokeWidth, progress)
        else -> draw10000Plus(count, c1, c2, c3, strokeWidth)
    }
}

/**
 * Draws 1-4 vertical strokes.
 */
private fun DrawScope.drawStrokes(
    count: Int,
    color: Color,
    strokeWidth: Float,
    progress: Float
) {
    val w = size.width
    val h = size.height
    val spacing = w * 0.2f
    val startX = (w - (count - 1) * spacing) / 2
    val topY = h * 0.2f
    val bottomY = h * 0.8f

    for (i in 0 until count) {
        val strokeProgress = ((progress * count) - i).coerceIn(0f, 1f)
        if (strokeProgress > 0f) {
            val x = startX + i * spacing
            val currentBottom = topY + (bottomY - topY) * strokeProgress
            drawLine(
                color = color,
                start = Offset(x, topY),
                end = Offset(x, currentBottom),
                strokeWidth = strokeWidth,
                cap = StrokeCap.Round
            )
        }
    }
}

/**
 * Draws a 5-gate (4 vertical strokes + diagonal slash).
 */
private fun DrawScope.drawFiveGate(
    inkColor: Color,
    accentColor: Color,
    strokeWidth: Float,
    progress: Float
) {
    val w = size.width
    val h = size.height
    val spacing = w * 0.18f
    val startX = (w - 3 * spacing) / 2
    val topY = h * 0.2f
    val bottomY = h * 0.8f

    // Draw 4 vertical strokes
    for (i in 0 until 4) {
        val strokeProgress = ((progress * 5) - i).coerceIn(0f, 1f)
        if (strokeProgress > 0f) {
            val x = startX + i * spacing
            val currentBottom = topY + (bottomY - topY) * strokeProgress
            drawLine(
                color = inkColor,
                start = Offset(x, topY),
                end = Offset(x, currentBottom),
                strokeWidth = strokeWidth,
                cap = StrokeCap.Round
            )
        }
    }

    // Draw diagonal slash (the 5th mark, accent color)
    val slashProgress = ((progress * 5) - 4).coerceIn(0f, 1f)
    if (slashProgress > 0f) {
        val slashStartX = startX - spacing * 0.3f
        val slashStartY = bottomY - (bottomY - topY) * 0.1f
        val slashEndX = startX + 3 * spacing + spacing * 0.3f
        val slashEndY = topY + (bottomY - topY) * 0.1f

        val currentEndX = slashStartX + (slashEndX - slashStartX) * slashProgress
        val currentEndY = slashStartY + (slashEndY - slashStartY) * slashProgress

        drawLine(
            color = accentColor,
            start = Offset(slashStartX, slashStartY),
            end = Offset(currentEndX, currentEndY),
            strokeWidth = strokeWidth * 1.2f,
            cap = StrokeCap.Round
        )
    }
}

/**
 * Draws 6-24 as multiple 5-gates in X layout.
 */
private fun DrawScope.drawMultipleFiveGates(
    count: Int,
    inkColor: Color,
    accentColor: Color,
    strokeWidth: Float,
    progress: Float
) {
    val fullGates = count / 5
    val remaining = count % 5

    val w = size.width
    val h = size.height

    // Positions in X layout: center, NE, NW, SE, SW
    val positions = listOf(
        Offset(0.5f, 0.5f),  // center
        Offset(0.75f, 0.25f), // NE
        Offset(0.25f, 0.25f), // NW
        Offset(0.75f, 0.75f), // SE
        Offset(0.25f, 0.75f)  // SW
    )

    val gateSize = w * 0.35f

    for (i in 0 until fullGates.coerceAtMost(5)) {
        val pos = positions[i]
        translate(
            left = pos.x * w - gateSize / 2,
            top = pos.y * h - gateSize / 2
        ) {
            drawMiniGate(inkColor, accentColor, strokeWidth * 0.6f, gateSize, 5, progress)
        }
    }

    // Draw remaining strokes in next position
    if (remaining > 0 && fullGates < 5) {
        val pos = positions[fullGates]
        translate(
            left = pos.x * w - gateSize / 2,
            top = pos.y * h - gateSize / 2
        ) {
            drawMiniGate(inkColor, accentColor, strokeWidth * 0.6f, gateSize, remaining, progress)
        }
    }
}

/**
 * Draws a mini gate for compound layouts.
 */
private fun DrawScope.drawMiniGate(
    inkColor: Color,
    accentColor: Color,
    strokeWidth: Float,
    gateSize: Float,
    strokeCount: Int,
    progress: Float
) {
    val spacing = gateSize * 0.2f
    val startX = (gateSize - 3 * spacing) / 2
    val topY = gateSize * 0.15f
    val bottomY = gateSize * 0.85f

    val drawCount = strokeCount.coerceAtMost(4)
    for (i in 0 until drawCount) {
        val x = startX + i * spacing
        drawLine(
            color = inkColor,
            start = Offset(x, topY),
            end = Offset(x, bottomY),
            strokeWidth = strokeWidth,
            cap = StrokeCap.Round
        )
    }

    if (strokeCount >= 5) {
        val slashStartX = startX - spacing * 0.2f
        val slashStartY = bottomY - (bottomY - topY) * 0.1f
        val slashEndX = startX + 3 * spacing + spacing * 0.2f
        val slashEndY = topY + (bottomY - topY) * 0.1f

        drawLine(
            color = accentColor,
            start = Offset(slashStartX, slashStartY),
            end = Offset(slashEndX, slashEndY),
            strokeWidth = strokeWidth * 1.1f,
            cap = StrokeCap.Round
        )
    }
}

/**
 * Draws a 25-unit with optional X overlay.
 */
private fun DrawScope.drawTwentyFiveUnit(
    c1: Color,
    c2: Color,
    accent: Color,
    strokeWidth: Float,
    progress: Float,
    showOverlay: Boolean
) {
    // Draw 5 complete 5-gates
    drawMultipleFiveGates(25, c1, accent, strokeWidth, progress)

    // Draw X overlay in C2 if complete
    if (showOverlay) {
        val w = size.width
        val h = size.height
        val padding = w * 0.1f

        drawLine(
            color = c2,
            start = Offset(padding, padding),
            end = Offset(w - padding, h - padding),
            strokeWidth = strokeWidth * 1.5f,
            cap = StrokeCap.Round
        )
        drawLine(
            color = c2,
            start = Offset(w - padding, padding),
            end = Offset(padding, h - padding),
            strokeWidth = strokeWidth * 1.5f,
            cap = StrokeCap.Round
        )
    }
}

/**
 * Draws 26-99 as 2x2 grid of 25-units.
 */
private fun DrawScope.draw26To99(
    count: Int,
    c1: Color,
    c2: Color,
    accent: Color,
    strokeWidth: Float,
    progress: Float
) {
    val w = size.width
    val h = size.height
    val cellSize = w * 0.45f
    val gap = w * 0.05f

    val full25s = count / 25
    val remaining = count % 25

    val positions = listOf(
        Offset(gap, gap),
        Offset(w / 2 + gap / 2, gap),
        Offset(gap, h / 2 + gap / 2),
        Offset(w / 2 + gap / 2, h / 2 + gap / 2)
    )

    for (i in 0 until full25s.coerceAtMost(4)) {
        translate(left = positions[i].x, top = positions[i].y) {
            drawMini25(c1, c2, accent, strokeWidth * 0.5f, cellSize, 25, true)
        }
    }

    if (remaining > 0 && full25s < 4) {
        translate(left = positions[full25s].x, top = positions[full25s].y) {
            drawMini25(c1, c2, accent, strokeWidth * 0.5f, cellSize, remaining, false)
        }
    }
}

/**
 * Draws a mini 25-unit.
 */
private fun DrawScope.drawMini25(
    c1: Color,
    c2: Color,
    accent: Color,
    strokeWidth: Float,
    unitSize: Float,
    count: Int,
    showOverlay: Boolean
) {
    val fullGates = count / 5
    val remaining = count % 5

    val positions = listOf(
        Offset(0.5f, 0.5f),
        Offset(0.75f, 0.25f),
        Offset(0.25f, 0.25f),
        Offset(0.75f, 0.75f),
        Offset(0.25f, 0.75f)
    )

    val gateSize = unitSize * 0.35f

    for (i in 0 until fullGates.coerceAtMost(5)) {
        val pos = positions[i]
        translate(
            left = pos.x * unitSize - gateSize / 2,
            top = pos.y * unitSize - gateSize / 2
        ) {
            drawMiniGate(c1, accent, strokeWidth * 0.6f, gateSize, 5, 1f)
        }
    }

    if (remaining > 0 && fullGates < 5) {
        val pos = positions[fullGates]
        translate(
            left = pos.x * unitSize - gateSize / 2,
            top = pos.y * unitSize - gateSize / 2
        ) {
            drawMiniGate(c1, accent, strokeWidth * 0.6f, gateSize, remaining, 1f)
        }
    }

    if (showOverlay && count >= 25) {
        val padding = unitSize * 0.1f
        drawLine(
            color = c2,
            start = Offset(padding, padding),
            end = Offset(unitSize - padding, unitSize - padding),
            strokeWidth = strokeWidth * 1.5f,
            cap = StrokeCap.Round
        )
        drawLine(
            color = c2,
            start = Offset(unitSize - padding, padding),
            end = Offset(padding, unitSize - padding),
            strokeWidth = strokeWidth * 1.5f,
            cap = StrokeCap.Round
        )
    }
}

/**
 * Draws 100 cap: X + square outline.
 */
private fun DrawScope.draw100Cap(
    c2: Color,
    c3: Color,
    strokeWidth: Float
) {
    val w = size.width
    val h = size.height
    val padding = w * 0.1f

    // Square outline in C3
    drawRect(
        color = c3,
        topLeft = Offset(padding, padding),
        size = androidx.compose.ui.geometry.Size(w - 2 * padding, h - 2 * padding),
        style = Stroke(width = strokeWidth * 1.5f, join = StrokeJoin.Round)
    )

    // X in C2
    val innerPadding = padding * 1.5f
    drawLine(
        color = c2,
        start = Offset(innerPadding, innerPadding),
        end = Offset(w - innerPadding, h - innerPadding),
        strokeWidth = strokeWidth * 1.3f,
        cap = StrokeCap.Round
    )
    drawLine(
        color = c2,
        start = Offset(w - innerPadding, innerPadding),
        end = Offset(innerPadding, h - innerPadding),
        strokeWidth = strokeWidth * 1.3f,
        cap = StrokeCap.Round
    )
}

/**
 * Draws 101-999 as row of 100-blocks.
 */
private fun DrawScope.draw101To999(
    count: Int,
    c1: Color,
    c2: Color,
    c3: Color,
    accent: Color,
    strokeWidth: Float,
    progress: Float
) {
    val w = size.width
    val h = size.height
    val full100s = count / 100
    val remaining = count % 100

    val blockCount = full100s + (if (remaining > 0) 1 else 0)
    val blockSize = (w / blockCount.coerceAtLeast(1).toFloat()).coerceAtMost(h * 0.9f)
    val totalWidth = blockSize * blockCount
    val startX = (w - totalWidth) / 2

    for (i in 0 until full100s.coerceAtMost(10)) {
        translate(left = startX + i * blockSize, top = (h - blockSize) / 2) {
            drawMini100(c2, c3, strokeWidth * 0.5f, blockSize)
        }
    }

    if (remaining > 0 && full100s < 10) {
        translate(left = startX + full100s * blockSize, top = (h - blockSize) / 2) {
            // Show partial block as 2x2 grid
            draw26To99Mini(remaining, c1, c2, accent, strokeWidth * 0.4f, blockSize)
        }
    }
}

/**
 * Draws a mini 100 block.
 */
private fun DrawScope.drawMini100(
    c2: Color,
    c3: Color,
    strokeWidth: Float,
    blockSize: Float
) {
    val padding = blockSize * 0.1f

    drawRect(
        color = c3,
        topLeft = Offset(padding, padding),
        size = androidx.compose.ui.geometry.Size(blockSize - 2 * padding, blockSize - 2 * padding),
        style = Stroke(width = strokeWidth * 1.2f, join = StrokeJoin.Round)
    )

    val innerPadding = padding * 1.5f
    drawLine(
        color = c2,
        start = Offset(innerPadding, innerPadding),
        end = Offset(blockSize - innerPadding, blockSize - innerPadding),
        strokeWidth = strokeWidth,
        cap = StrokeCap.Round
    )
    drawLine(
        color = c2,
        start = Offset(blockSize - innerPadding, innerPadding),
        end = Offset(innerPadding, blockSize - innerPadding),
        strokeWidth = strokeWidth,
        cap = StrokeCap.Round
    )
}

/**
 * Mini version of 26-99 for partial blocks.
 */
private fun DrawScope.draw26To99Mini(
    count: Int,
    c1: Color,
    c2: Color,
    accent: Color,
    strokeWidth: Float,
    containerSize: Float
) {
    val cellSize = containerSize * 0.4f
    val gap = containerSize * 0.05f

    val full25s = count / 25
    val remaining = count % 25

    val positions = listOf(
        Offset(gap, gap),
        Offset(containerSize / 2 + gap / 2, gap),
        Offset(gap, containerSize / 2 + gap / 2),
        Offset(containerSize / 2 + gap / 2, containerSize / 2 + gap / 2)
    )

    for (i in 0 until full25s.coerceAtMost(4)) {
        translate(left = positions[i].x, top = positions[i].y) {
            drawMini25(c1, c2, accent, strokeWidth * 0.5f, cellSize, 25, true)
        }
    }

    if (remaining > 0 && full25s < 4) {
        translate(left = positions[full25s].x, top = positions[full25s].y) {
            drawMini25(c1, c2, accent, strokeWidth * 0.5f, cellSize, remaining, false)
        }
    }
}

/**
 * Draws 1000 cap: 10 squares + horizontal line.
 */
private fun DrawScope.draw1000Cap(
    c3: Color,
    c1: Color,
    strokeWidth: Float
) {
    val w = size.width
    val h = size.height
    val blockSize = w / 10f
    val squareSize = blockSize * 0.7f
    val padding = (blockSize - squareSize) / 2

    // Draw 10 squares
    for (i in 0 until 10) {
        val x = i * blockSize + padding
        val y = (h - squareSize) / 2
        drawRect(
            color = c3,
            topLeft = Offset(x, y),
            size = androidx.compose.ui.geometry.Size(squareSize, squareSize),
            style = Stroke(width = strokeWidth, join = StrokeJoin.Round)
        )
    }

    // Horizontal line through all
    drawLine(
        color = c1,
        start = Offset(0f, h / 2),
        end = Offset(w, h / 2),
        strokeWidth = strokeWidth * 1.5f,
        cap = StrokeCap.Round
    )
}

/**
 * Draws 1001-9999 as stacked rows.
 */
private fun DrawScope.draw1001To9999(
    count: Int,
    c1: Color,
    c2: Color,
    c3: Color,
    accent: Color,
    strokeWidth: Float,
    progress: Float
) {
    val w = size.width
    val h = size.height
    val full1000s = count / 1000
    val remaining = count % 1000

    val rowCount = full1000s + (if (remaining > 0) 1 else 0)
    val rowHeight = (h / rowCount.coerceAtLeast(1).toFloat()).coerceAtMost(h * 0.15f)

    for (i in 0 until full1000s.coerceAtMost(10)) {
        translate(left = 0f, top = i * rowHeight) {
            drawMini1000Row(c3, c1, strokeWidth * 0.4f, w, rowHeight)
        }
    }

    if (remaining > 0 && full1000s < 10) {
        translate(left = 0f, top = full1000s * rowHeight) {
            val full100s = remaining / 100
            val blockSize = w / 10f
            for (j in 0 until full100s.coerceAtMost(10)) {
                translate(left = j * blockSize, top = 0f) {
                    drawMini100(c2, c3, strokeWidth * 0.3f, blockSize.coerceAtMost(rowHeight))
                }
            }
        }
    }
}

/**
 * Draws a mini 1000 row.
 */
private fun DrawScope.drawMini1000Row(
    c3: Color,
    c1: Color,
    strokeWidth: Float,
    rowWidth: Float,
    rowHeight: Float
) {
    val blockSize = rowWidth / 10f
    val squareSize = (blockSize * 0.7f).coerceAtMost(rowHeight * 0.8f)
    val padding = (blockSize - squareSize) / 2

    for (i in 0 until 10) {
        val x = i * blockSize + padding
        val y = (rowHeight - squareSize) / 2
        drawRect(
            color = c3,
            topLeft = Offset(x, y),
            size = androidx.compose.ui.geometry.Size(squareSize, squareSize),
            style = Stroke(width = strokeWidth, join = StrokeJoin.Round)
        )
    }

    drawLine(
        color = c1,
        start = Offset(0f, rowHeight / 2),
        end = Offset(rowWidth, rowHeight / 2),
        strokeWidth = strokeWidth * 1.2f,
        cap = StrokeCap.Round
    )
}

/**
 * Draws 10000+ with diagonal closure.
 */
private fun DrawScope.draw10000Plus(
    count: Int,
    c1: Color,
    c2: Color,
    c3: Color,
    strokeWidth: Float
) {
    val w = size.width
    val h = size.height

    // Draw 10x10 grid of squares
    val cellSize = (w / 10f).coerceAtMost(h / 10f)
    val squareSize = cellSize * 0.6f
    val offsetX = (w - 10 * cellSize) / 2
    val offsetY = (h - 10 * cellSize) / 2

    for (row in 0 until 10) {
        for (col in 0 until 10) {
            val x = offsetX + col * cellSize + (cellSize - squareSize) / 2
            val y = offsetY + row * cellSize + (cellSize - squareSize) / 2
            drawRect(
                color = c3,
                topLeft = Offset(x, y),
                size = androidx.compose.ui.geometry.Size(squareSize, squareSize),
                style = Stroke(width = strokeWidth * 0.5f, join = StrokeJoin.Round)
            )
        }
    }

    // Horizontal lines through each row
    for (row in 0 until 10) {
        val y = offsetY + row * cellSize + cellSize / 2
        drawLine(
            color = c1,
            start = Offset(offsetX, y),
            end = Offset(offsetX + 10 * cellSize, y),
            strokeWidth = strokeWidth * 0.6f,
            cap = StrokeCap.Round
        )
    }

    // Diagonal closure stroke (at exactly 10000)
    if (count == 10000) {
        drawLine(
            color = c2,
            start = Offset(offsetX, offsetY),
            end = Offset(offsetX + 10 * cellSize, offsetY + 10 * cellSize),
            strokeWidth = strokeWidth * 2f,
            cap = StrokeCap.Round
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun TallyMarkPreview() {
    TallyTheme {
        TallyMark(count = 7, size = 64.dp)
    }
}

@Preview(showBackground = true)
@Composable
private fun TallyMark25Preview() {
    TallyTheme {
        TallyMark(count = 25, size = 64.dp)
    }
}

@Preview(showBackground = true)
@Composable
private fun TallyMark100Preview() {
    TallyTheme {
        TallyMark(count = 100, size = 64.dp)
    }
}
