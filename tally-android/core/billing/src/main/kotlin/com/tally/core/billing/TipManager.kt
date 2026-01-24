package com.tally.core.billing

import android.app.Activity
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
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                    queryProducts(onReady)
                }
            }
            
            override fun onBillingServiceDisconnected() {
                // Optionally retry connection
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
        
        billingClient.queryProductDetailsAsync(params) { _, details ->
            _products.value = details.sortedBy { 
                it.oneTimePurchaseOfferDetails?.priceAmountMicros ?: 0 
            }
            onReady()
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
        
        billingClient.launchBillingFlow(activity, params)
    }
    
    override fun onPurchasesUpdated(result: BillingResult, purchases: List<Purchase>?) {
        when (result.responseCode) {
            BillingClient.BillingResponseCode.OK -> {
                purchases?.forEach { purchase ->
                    // Consume the purchase (tips are consumable)
                    val params = ConsumeParams.newBuilder()
                        .setPurchaseToken(purchase.purchaseToken)
                        .build()
                    
                    billingClient.consumeAsync(params) { _, _ ->
                        _purchaseState.value = PurchaseState.Purchased
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
        billingClient.endConnection()
    }
}
