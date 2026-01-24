package com.tally.core.billing

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.android.billingclient.api.ProductDetails

/**
 * Tip Jar screen for Google Play Billing tips.
 */
@Composable
fun TipJarScreen(
    tipManager: TipManager,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    val products by tipManager.products.collectAsStateWithLifecycle()
    val purchaseState by tipManager.purchaseState.collectAsStateWithLifecycle()
    
    LaunchedEffect(Unit) {
        tipManager.connect()
    }
    
    DisposableEffect(Unit) {
        onDispose {
            tipManager.disconnect()
        }
    }
    
    // Auto-dismiss on successful purchase after delay
    LaunchedEffect(purchaseState) {
        if (purchaseState is TipManager.PurchaseState.Purchased) {
            kotlinx.coroutines.delay(2000)
            tipManager.resetState()
        }
    }
    
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Header
        Text(
            text = "❤️",
            style = MaterialTheme.typography.displayMedium
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        Text(
            text = "Support Development",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )
        
        Spacer(modifier = Modifier.height(8.dp))
        
        Text(
            text = "Tips help fund continued development and new features. Thank you!",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Tip options
        if (products.isEmpty()) {
            CircularProgressIndicator()
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Loading...",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        } else {
            products.forEach { product ->
                TipButton(
                    product = product,
                    enabled = purchaseState !is TipManager.PurchaseState.Purchasing,
                    onClick = { tipManager.purchase(product) }
                )
                Spacer(modifier = Modifier.height(12.dp))
            }
        }
        
        // State feedback
        when (val state = purchaseState) {
            is TipManager.PurchaseState.Purchased -> {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "✓ Thank you!",
                    color = MaterialTheme.colorScheme.primary,
                    fontWeight = FontWeight.Medium
                )
            }
            is TipManager.PurchaseState.Failed -> {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = state.message,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }
            else -> {}
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Text(
            text = "Tips are optional and don't unlock additional features.",
            style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
        )
    }
}

@Composable
private fun TipButton(
    product: ProductDetails,
    enabled: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val emoji = when (product.productId) {
        "tip_small" -> "☕"
        "tip_medium" -> "🍺"
        "tip_large" -> "🍽️"
        else -> "💝"
    }
    
    val price = product.oneTimePurchaseOfferDetails?.formattedPrice ?: ""
    
    Surface(
        onClick = onClick,
        enabled = enabled,
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = emoji, style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.width(12.dp))
            Text(
                text = product.name,
                style = MaterialTheme.typography.bodyLarge,
                modifier = Modifier.weight(1f)
            )
            Text(
                text = price,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.SemiBold
            )
        }
    }
}
