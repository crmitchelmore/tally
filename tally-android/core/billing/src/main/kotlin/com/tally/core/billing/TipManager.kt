package com.tally.core.billing

import android.app.Activity
import android.os.Handler
import android.os.Looper
import com.android.billingclient.api.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Manages Google Play Billing for tip purchases.
 */
class TipManager(private val activity: Activity) : PurchasesUpdatedListener {
    
    private val billingClient = BillingClient.newBuilder(activity)
        .setListener(this)
        .enablePendingPurchases()
        .build()
    
    private val productIds = listOf("tip_small", "tip_medium", "tip_large")
    
    private val _products = MutableStateFlow<List<ProductDetails>>(emptyList())
    val products: StateFlow<List<ProductDetails>> = _products.asStateFlow()
    
    private val _purchaseState = MutableStateFlow<PurchaseState>(PurchaseState.Ready)
    val purchaseState: StateFlow<PurchaseState> = _purchaseState.asStateFlow()
    
    private var pendingOnReady: (() -> Unit)? = null
    
    sealed class PurchaseState {
        data object Ready : PurchaseState()
        data object Purchasing : PurchaseState()
        data object Purchased : PurchaseState()
        data class Failed(val message: String) : PurchaseState()
    }
    
    /**
     * Connect to billing service and load products.
     */
    fun connect(onReady: () -> Unit = {}) {
        pendingOnReady = onReady
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                    queryProducts(onReady)
                } else {
                    _purchaseState.value = PurchaseState.Failed(
                        result.debugMessage.ifEmpty { "Failed to connect to billing service" }
                    )
                }
            }
            
            override fun onBillingServiceDisconnected() {
                // Retry connection after delay
                Handler(Looper.getMainLooper()).postDelayed({
                    if (!billingClient.isReady) {
                        pendingOnReady?.let { connect(it) }
                    }
                }, 3000)
            }
        })
    }
    
    private fun queryProducts(onReady: () -> Unit) {
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(productIds.map { productId ->
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(productId)
                    .setProductType(BillingClient.ProductType.INAPP)
                    .build()
            })
            .build()
        
        billingClient.queryProductDetailsAsync(params) { result, details ->
            if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                _products.value = details.sortedBy { 
                    it.oneTimePurchaseOfferDetails?.priceAmountMicros ?: 0 
                }
                onReady()
            } else {
                _purchaseState.value = PurchaseState.Failed(
                    result.debugMessage.ifEmpty { "Failed to load products" }
                )
            }
        }
    }
    
    /**
     * Launch purchase flow for a product.
     */
    fun purchase(product: ProductDetails) {
        _purchaseState.value = PurchaseState.Purchasing
        
        val params = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(listOf(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(product)
                    .build()
            ))
            .build()
        
        val result = billingClient.launchBillingFlow(activity, params)
        if (result.responseCode != BillingClient.BillingResponseCode.OK) {
            _purchaseState.value = PurchaseState.Failed(
                result.debugMessage.ifEmpty { "Unable to start purchase flow" }
            )
        }
    }
    
    override fun onPurchasesUpdated(result: BillingResult, purchases: List<Purchase>?) {
        when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                if (purchases.isNullOrEmpty()) {
                    _purchaseState.value = PurchaseState.Failed("No purchase received")
                    return
                }
                purchases.forEach { purchase ->
                    if (purchase.purchaseState != Purchase.PurchaseState.PURCHASED) {
                        // Pending purchase - don't grant yet
                        _purchaseState.value = PurchaseState.Ready
                        return@forEach
                    }
                    // Consume the purchase (tips are consumable)
                    val params = ConsumeParams.newBuilder()
                        .setPurchaseToken(purchase.purchaseToken)
                        .build()
                    
                    billingClient.consumeAsync(params) { consumeResult, _ ->
                        _purchaseState.value = if (consumeResult.responseCode == BillingClient.BillingResponseCode.OK) {
                            PurchaseState.Purchased
                        } else {
                            PurchaseState.Failed(
                                consumeResult.debugMessage.ifEmpty { "Failed to complete purchase" }
                            )
                        }
                    }
                }
            }
            BillingClient.BillingResponseCode.USER_CANCELED -> {
                _purchaseState.value = PurchaseState.Ready
            }
            else -> {
                _purchaseState.value = PurchaseState.Failed(
                    result.debugMessage.ifEmpty { "Purchase failed" }
                )
            }
        }
    }
    
    /**
     * Reset purchase state to ready.
     */
    fun resetState() {
        _purchaseState.value = PurchaseState.Ready
    }
    
    /**
     * Disconnect from billing service.
     */
    fun disconnect() {
        pendingOnReady = null
        billingClient.endConnection()
    }
}
