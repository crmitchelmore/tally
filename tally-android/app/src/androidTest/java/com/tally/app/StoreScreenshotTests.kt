package com.tally.app

import android.graphics.Bitmap
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import androidx.compose.ui.test.onNodeWithTag
import androidx.test.platform.app.InstrumentationRegistry
import com.tally.app.pages.AuthPage
import com.tally.app.pages.ChallengeDialogPage
import com.tally.app.pages.DashboardPage
import com.tally.app.pages.EntryDialogPage
import com.tally.app.utils.FreshLocalDataRule
import java.io.File
import org.junit.Rule
import org.junit.Test

/** Actual app screenshots with fictional local data, reproducible in CI. */
class StoreScreenshotTests {
    @get:Rule(order = 0) val freshData = FreshLocalDataRule()
    @get:Rule(order = 1) val composeRule = createAndroidComposeRule<MainActivity>()

    @Test fun captureStoreScreens() {
        composeRule.waitForIdle()
        if (composeRule.onAllNodes(androidx.compose.ui.test.hasTestTag("sign_in_screen")).fetchSemanticsNodes().isNotEmpty()) {
            AuthPage(composeRule).tapContinueWithoutAccount()
        }
        composeRule.onNodeWithTag("dashboard").assertExists()
        val dashboard = DashboardPage(composeRule)
        val form = ChallengeDialogPage(composeRule)
        dashboard.tapCreateChallenge()
        form.fillChallenge("Read a little every day", "500")
        form.tapSave()
        dashboard.assertChallengeExists("Read a little every day")
        dashboard.tapQuickAdd("Read a little every day")
        EntryDialogPage(composeRule).addEntry("25")
        dashboard.assertTotal(25, 500)
        capture("01-progress")
        dashboard.tapChallenge("Read a little every day")
        capture("02-goal")
    }

    private fun capture(name: String) {
        composeRule.waitForIdle()
        val instrumentation = InstrumentationRegistry.getInstrumentation()
        val directory = File(instrumentation.targetContext.filesDir, "store-screenshots").apply { mkdirs() }
        val bitmap = checkNotNull(instrumentation.uiAutomation.takeScreenshot())
        File(directory, "$name.png").outputStream().use { bitmap.compress(Bitmap.CompressFormat.PNG, 100, it) }
        bitmap.recycle()
    }
}
