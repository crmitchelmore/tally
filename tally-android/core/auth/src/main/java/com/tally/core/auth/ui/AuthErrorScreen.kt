package com.tally.core.auth.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.tally.core.design.TallyColors
import com.tally.core.design.TallySpacing

/**
 * Error screen shown when authentication fails.
 */
@Composable
fun AuthErrorScreen(
    message: String,
    onRetryClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .background(TallyColors.paper())
            .padding(TallySpacing.xl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text(
            text = "Something went wrong",
            style = MaterialTheme.typography.headlineMedium,
            color = TallyColors.inkC1(),
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(TallySpacing.md))

        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            color = TallyColors.inkC2(),
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(TallySpacing.xl))

        Button(
            onClick = onRetryClick,
            modifier = Modifier.height(48.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = TallyColors.inkC1()
            )
        ) {
            Text(text = "Try again")
        }
    }
}
