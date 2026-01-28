package com.tally.core.auth.ui

import android.content.Context
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.tally.core.design.TallyColors
import com.tally.core.design.TallySpacing

/**
 * Sign-in screen with tally mark logo and CTA.
 * Follows design philosophy: tactile, focused, honest.
 */
@Composable
fun SignInScreen(
    onSignInClick: (Context) -> Unit,
    onContinueWithoutAccount: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current

    Column(
        modifier = modifier
            .fillMaxSize()
            .background(TallyColors.paper())
            .padding(TallySpacing.xl)
            .testTag("sign_in_screen"),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Tally mark logo
        TallyLogo(
            modifier = Modifier
                .size(120.dp)
                .semantics { contentDescription = "Tally app logo" }
        )

        Spacer(modifier = Modifier.height(TallySpacing.xxl))

        // App name
        Text(
            text = "Tally",
            style = MaterialTheme.typography.displayLarge,
            fontWeight = FontWeight.Bold,
            color = TallyColors.inkC1(),
            modifier = Modifier.testTag("app_title")
        )

        Spacer(modifier = Modifier.height(TallySpacing.md))

        // Tagline
        Text(
            text = "Track what matters",
            style = MaterialTheme.typography.titleLarge,
            color = TallyColors.inkC2(),
            textAlign = TextAlign.Center,
            modifier = Modifier.testTag("app_tagline")
        )

        Spacer(modifier = Modifier.height(TallySpacing.xxxl))

        // Sign in button (primary CTA)
        Button(
            onClick = { onSignInClick(context) },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .testTag("sign_in_button"),
            colors = ButtonDefaults.buttonColors(
                containerColor = TallyColors.inkC1()
            )
        ) {
            Text(
                text = "Sign in",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
        }

        Spacer(modifier = Modifier.height(TallySpacing.md))
        
        // Continue without account (secondary)
        OutlinedButton(
            onClick = onContinueWithoutAccount,
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
                .testTag("continue_without_account_button"),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.outlinedButtonColors(
                contentColor = TallyColors.inkC2()
            )
        ) {
            Text(
                text = "Continue without account",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Medium
            )
        }

        Spacer(modifier = Modifier.height(TallySpacing.lg))

        // Secondary text
        Text(
            text = "Your data stays on this device in local-only mode.",
            style = MaterialTheme.typography.bodyMedium,
            color = TallyColors.inkC3(),
            textAlign = TextAlign.Center
        )
    }
}

/**
 * Tally mark logo: 4 vertical strokes + diagonal slash.
 */
@Composable
private fun TallyLogo(
    modifier: Modifier = Modifier
) {
    val inkC1 = TallyColors.inkC1()
    val accent = TallyColors.accent()

    Box(modifier = modifier) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val strokeWidth = size.width * 0.08f
            val gap = size.width * 0.15f
            val startX = size.width * 0.15f
            val topY = size.height * 0.15f
            val bottomY = size.height * 0.85f

            // Draw 4 vertical strokes
            for (i in 0 until 4) {
                val x = startX + (i * gap)
                drawLine(
                    color = inkC1,
                    start = Offset(x, topY),
                    end = Offset(x, bottomY),
                    strokeWidth = strokeWidth,
                    cap = StrokeCap.Round
                )
            }

            // Draw diagonal slash (5th mark) in accent color
            val slashStartX = startX - gap * 0.3f
            val slashEndX = startX + gap * 3.3f
            drawLine(
                color = accent,
                start = Offset(slashStartX, bottomY * 0.9f),
                end = Offset(slashEndX, topY * 1.1f),
                strokeWidth = strokeWidth * 1.1f,
                cap = StrokeCap.Round
            )
        }
    }
}
