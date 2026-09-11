package com.tally.app
import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createAndroidComposeRule
import com.tally.app.utils.FreshLocalDataRule
import org.junit.Rule
import org.junit.Test
import org.junit.Assert.*
import app.tally.core.telemetry.PrivacyTelemetry

class PrivacyChoiceTests {
    @get:Rule(order = 0) val freshData = FreshLocalDataRule(privacyChosen = false)
    @get:Rule(order = 1) val compose = createAndroidComposeRule<MainActivity>()
    @Test fun decliningPersistsAcrossRecreation() {
        compose.onNodeWithTag("privacy_analytics").assertIsOff()
        compose.onNodeWithTag("privacy_diagnostics").assertIsOff()
        compose.onNodeWithTag("privacy_decline").performClick()
        assertTrue(PrivacyTelemetry.hasChosen)
        assertFalse(PrivacyTelemetry.analyticsEnabled)
        assertFalse(PrivacyTelemetry.diagnosticsEnabled)
        compose.activityRule.scenario.recreate()
        compose.onNodeWithTag("privacy_decline").assertDoesNotExist()
    }
    @Test fun choicesAreIndependentAndCanBeWithdrawn() {
        compose.onNodeWithTag("privacy_analytics").performClick()
        compose.onNodeWithTag("privacy_save").performClick()
        assertTrue(PrivacyTelemetry.analyticsEnabled)
        assertFalse(PrivacyTelemetry.diagnosticsEnabled)
        PrivacyTelemetry.save(false, false)
        assertFalse(PrivacyTelemetry.analyticsEnabled)
        compose.activityRule.scenario.recreate()
        assertFalse(PrivacyTelemetry.analyticsEnabled)
    }
}
