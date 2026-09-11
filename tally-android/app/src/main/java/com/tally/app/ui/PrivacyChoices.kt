package com.tally.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.contentDescription
import app.tally.core.telemetry.PrivacyTelemetry

@Composable
fun PrivacyChoices(onDismiss: () -> Unit) {
    var analytics by remember { mutableStateOf(PrivacyTelemetry.analyticsEnabled) }
    var diagnostics by remember { mutableStateOf(PrivacyTelemetry.diagnosticsEnabled) }
    val uri = LocalUriHandler.current
    AlertDialog(
        onDismissRequest = {
            if (PrivacyTelemetry.hasChosen) onDismiss()
        },
        title = { Text("Your privacy choices") },
        text = {
            Column(Modifier.verticalScroll(rememberScrollState())) {
                Text("A little feedback helps Tally grow. Sharing is optional. Every feature works with both choices off, and you can change them in Settings.")
                Spacer(Modifier.height(16.dp))
                Text("Share usage analytics", style = MaterialTheme.typography.titleSmall)
                Switch(analytics, { analytics = it }, Modifier.testTag("privacy_analytics").semantics { contentDescription = "Share usage analytics" })
                Text("Send feature-use events, app and device details, and a random device identifier to PostHog in the EU. If signed in, server events are linked to your account ID. No goal names, notes, entry contents or screen recordings.")
                Spacer(Modifier.height(16.dp))
                Text("Share crash reports", style = MaterialTheme.typography.titleSmall)
                Switch(diagnostics, { diagnostics = it }, Modifier.testTag("privacy_diagnostics").semantics { contentDescription = "Share crash reports" })
                Text("Send crash details, stack traces and app and device information to Sentry to help fix problems. No screenshots, screen recordings or account details.")
                TextButton({ uri.openUri("https://tally-tracker.app/privacy") }) { Text("Read the privacy policy") }
                Text("No advertising or tracking across other apps. Essential account, sync and security processing still works.")
            }
        },
        confirmButton = {
            TextButton({ PrivacyTelemetry.save(analytics, diagnostics); onDismiss() }, Modifier.testTag("privacy_save")) { Text("Save my choices") }
        },
        dismissButton = {
            TextButton({ PrivacyTelemetry.save(false, false); onDismiss() }, Modifier.testTag("privacy_decline")) { Text("Continue without sharing") }
        }
    )
}
