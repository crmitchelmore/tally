package com.tally.app

import android.os.ParcelFileDescriptor
import android.provider.Settings
import androidx.compose.material3.Text
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import com.tally.core.design.LocalReduceMotion
import com.tally.core.design.TallyTheme
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/** Exercise the real system preference while a themed surface remains mounted. */
@RunWith(AndroidJUnit4::class)
class MotionPreferenceTests {
    @get:Rule val composeRule = createComposeRule()

    @Test
    fun removeAnimationsUpdatesWithoutRestarting() {
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val original = Settings.Global.getString(
            instrumentation.targetContext.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE
        )
        fun shell(command: String) {
            ParcelFileDescriptor.AutoCloseInputStream(
                instrumentation.uiAutomation.executeShellCommand(command)
            ).use { it.readBytes() }
        }
        fun expectPreference(text: String) {
            composeRule.waitUntil(5_000) {
                composeRule.onAllNodesWithText(text).fetchSemanticsNodes().isNotEmpty()
            }
        }
        try {
            shell("settings put global animator_duration_scale 1")
            composeRule.setContent {
                TallyTheme {
                    Text(if (LocalReduceMotion.current) "Motion reduced" else "Motion enabled")
                }
            }
            expectPreference("Motion enabled")
            shell("settings put global animator_duration_scale 0")
            expectPreference("Motion reduced")
            shell("settings put global animator_duration_scale 1")
            expectPreference("Motion enabled")
        } finally {
            if (original == null) shell("settings delete global animator_duration_scale")
            else shell("settings put global animator_duration_scale $original")
        }
    }
}
