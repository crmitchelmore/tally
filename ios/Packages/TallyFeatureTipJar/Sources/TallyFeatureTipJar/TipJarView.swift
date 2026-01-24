import SwiftUI
import StoreKit

/// A view displaying tip options using StoreKit 2.
public struct TipJarView: View {
    @StateObject private var store = TipStore.shared
    @Environment(\.dismiss) private var dismiss
    
    public init() {}
    
    public var body: some View {
        VStack(spacing: 20) {
            // Header
            VStack(spacing: 8) {
                Image(systemName: "heart.fill")
                    .font(.system(size: 50))
                    .foregroundStyle(.pink)
                
                Text("Support Development")
                    .font(.title2.bold())
                
                Text("Tips help fund continued development and new features. Thank you!")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.top)
            
            // Tip Options
            if store.products.isEmpty {
                ProgressView("Loading...")
                    .task { await store.loadProducts() }
            } else {
                VStack(spacing: 12) {
                    ForEach(store.products, id: \.id) { product in
                        TipButton(product: product, store: store)
                    }
                }
            }
            
            // State feedback
            switch store.purchaseState {
            case .purchased:
                Label("Thank you!", systemImage: "checkmark.circle.fill")
                    .foregroundStyle(.green)
                    .onAppear {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                            store.resetState()
                        }
                    }
            case .failed(let message):
                Label(message, systemImage: "xmark.circle.fill")
                    .foregroundStyle(.red)
                    .font(.caption)
            default:
                EmptyView()
            }
            
            Spacer()
            
            Text("Tips are optional and don't unlock additional features.")
                .font(.caption2)
                .foregroundStyle(.tertiary)
        }
        .padding()
        .frame(minWidth: 300, minHeight: 400)
    }
}

struct TipButton: View {
    let product: Product
    @ObservedObject var store: TipStore
    
    var emoji: String {
        switch product.id {
        case "tip_small": return "☕"
        case "tip_medium": return "🍺"
        case "tip_large": return "🍽️"
        default: return "💝"
        }
    }
    
    var body: some View {
        Button {
            Task { await store.purchase(product) }
        } label: {
            HStack {
                Text(emoji)
                Text(product.displayName)
                Spacer()
                Text(product.displayPrice)
                    .fontWeight(.semibold)
            }
            .padding()
            .background(.fill.tertiary)
            .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .buttonStyle(.plain)
        .disabled(store.purchaseState == .purchasing)
    }
}

#Preview {
    TipJarView()
}
