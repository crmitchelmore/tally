import SwiftUI
import TallyCore
import TallyDesign
import Clerk

/// Root view that switches between signed-in and signed-out states
public struct AuthRootView<SignedInContent: View, SignedOutContent: View>: View {
    @Bindable private var authManager = AuthManager.shared
    @Environment(\.clerk) private var clerk
    
    private let signedInContent: () -> SignedInContent
    private let signedOutContent: () -> SignedOutContent
    
    public init(
        @ViewBuilder signedIn: @escaping () -> SignedInContent,
        @ViewBuilder signedOut: @escaping () -> SignedOutContent
    ) {
        self.signedInContent = signedIn
        self.signedOutContent = signedOut
    }
    
    public var body: some View {
        Group {
            if authManager.isLoading {
                if authManager.isLocalOnlyMode || KeychainService.shared.hasToken {
                    signedInContent()
                } else {
                    signedOutContent()
                }
            } else if authManager.isLocalOnlyMode {
                // No auth configured - run in local-only mode
                signedInContent()
            } else if authManager.isAuthenticated {
                signedInContent()
            } else {
                signedOutContent()
            }
        }
        .task {
            await authManager.configure()
        }
        .onChange(of: clerk.user) { _, _ in
            Task {
                await authManager.updateAuthState()
            }
        }
        .alert(
            "Something went wrong",
            isPresented: .init(
                get: { authManager.error != nil && !(authManager.error?.isNonFatal ?? true) },
                set: { if !$0 { authManager.clearError() } }
            ),
            presenting: authManager.error
        ) { _ in
            Button("OK") {
                authManager.clearError()
            }
        } message: { error in
            Text(error.localizedDescription)
        }
    }
}
