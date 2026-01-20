package com.tally.core.design

/**
 * Tally motion tokens following design philosophy:
 * - Short durations (120-420ms)
 * - Respect reduced motion settings
 * - Support comprehension, not distract
 */
object TallyMotion {
    /** Stroke drawing animation (120ms) */
    const val StrokeDurationMs = 120

    /** UI feedback (220ms) */
    const val FeedbackDurationMs = 220

    /** Panel/sheet transitions (420ms) */
    const val PanelDurationMs = 420

    /** Standard easing for most animations */
    const val StandardEasing = "cubic-bezier(0.4, 0.0, 0.2, 1.0)"
}
