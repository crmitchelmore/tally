import StoreKit

/// Manages StoreKit 2 in-app purchase products for tips.
@MainActor
public final class TipStore: ObservableObject {
    
    public static let shared = TipStore()
    
    @Published public private(set) var products: [Product] = []
    @Published public private(set) var purchaseState: PurchaseState = .ready
    
    public enum PurchaseState: Equatable {
        case ready
        case purchasing
        case purchased
        case failed(String)
    }
    
    private let productIDs = [
        "tip_small",
        "tip_medium",
        "tip_large"
    ]
    
    private init() {}
    
    /// Load available tip products from the App Store.
    public func loadProducts() async {
        do {
            products = try await Product.products(for: productIDs)
                .sorted { $0.price < $1.price }
        } catch {
            print("Failed to load products: \(error)")
            purchaseState = .failed("Failed to load products. Please try again later.")
        }
    }
    
    /// Purchase a tip product.
    public func purchase(_ product: Product) async {
        purchaseState = .purchasing
        
        do {
            let result = try await product.purchase()
            
            switch result {
            case .success(let verification):
                switch verification {
                case .verified(let transaction):
                    await transaction.finish()
                    purchaseState = .purchased
                case .unverified:
                    purchaseState = .failed("Transaction could not be verified")
                }
            case .userCancelled:
                purchaseState = .ready
            case .pending:
                purchaseState = .ready
            @unknown default:
                purchaseState = .ready
            }
        } catch {
            purchaseState = .failed(error.localizedDescription)
        }
    }
    
    /// Reset purchase state to ready.
    public func resetState() {
        purchaseState = .ready
    }
}
