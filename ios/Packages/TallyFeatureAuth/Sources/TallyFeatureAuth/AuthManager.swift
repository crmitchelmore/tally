import SwiftUI
import TallyCore
import Clerk

/// Authentication state manager using Clerk
@MainActor
@Observable
public final class AuthManager {
    public static let shared = AuthManager()
    
    public private(set) var isLoading = true
    public private(set) var isAuthenticated = false
    public private(set) var isLocalOnlyMode = false
    public private(set) var currentUser: TallyUser?
    public private(set) var error: AuthError?
    
    private var clerk: Clerk { Clerk.shared }
    
    private init() {}
    
    /// Configure Clerk with the publishable key
    public func configure() async {
        guard Configuration.isConfigured else {
            // No auth configured - run in local-only mode
            isLocalOnlyMode = true
            isLoading = false
            return
        }
        
        do {
            try await clerk.configure(publishableKey: Configuration.clerkPublishableKey)
            try await clerk.load()
            await updateAuthState()
        } catch {
            self.error = .clerkError(error)
            isLoading = false
        }
    }
    
    /// Update local auth state from Clerk
    public func updateAuthState() async {
        isLoading = true
        defer { isLoading = false }
        
        if let clerkUser = clerk.user {
            isAuthenticated = true
            currentUser = TallyUser(
                id: clerkUser.id,
                email: clerkUser.primaryEmailAddress?.emailAddress,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName,
                imageUrl: clerkUser.imageUrl
            )
            
            // Sync token to Keychain and provision user
            await syncTokenAndProvisionUser()
        } else {
            isAuthenticated = false
            currentUser = nil
            KeychainService.shared.deleteToken()
        }
    }
    
    /// Sync the session token to Keychain and call /api/v1/auth/user
    private func syncTokenAndProvisionUser() async {
        guard let session = clerk.session else { return }
        
        do {
            // Get the session token
            let tokenResult = try await session.getToken()
            if let token = tokenResult?.jwt {
                try KeychainService.shared.storeToken(token)
                
                // Provision user via API
                await provisionUser(token: token)
            }
        } catch {
            self.error = .tokenSyncFailed(error)
        }
    }
    
    /// Call POST /api/v1/auth/user to ensure user exists in backend
    private func provisionUser(token: String) async {
        guard let url = URL(string: "\(Configuration.apiBaseURL)/api/v1/auth/user") else {
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let (_, response) = try await URLSession.shared.data(for: request)
            if let httpResponse = response as? HTTPURLResponse,
               !(200...299).contains(httpResponse.statusCode) {
                self.error = .provisionFailed(httpResponse.statusCode)
            }
        } catch {
            // Non-fatal: user may be offline
            self.error = .networkError(error)
        }
    }
    
    /// Sign out the current user
    public func signOut() async {
        do {
            try await clerk.signOut()
            isAuthenticated = false
            currentUser = nil
            KeychainService.shared.deleteToken()
            error = nil
        } catch {
            self.error = .signOutFailed(error)
        }
    }
    
    /// Clear error state
    public func clearError() {
        error = nil
    }
}

public enum AuthError: Error, LocalizedError {
    case notConfigured
    case clerkError(Error)
    case tokenSyncFailed(Error)
    case provisionFailed(Int)
    case networkError(Error)
    case signOutFailed(Error)
    
    public var errorDescription: String? {
        switch self {
        case .notConfigured:
            return "App not configured. Please check your settings."
        case .clerkError(let error):
            return "Authentication error: \(error.localizedDescription)"
        case .tokenSyncFailed(let error):
            return "Failed to secure session: \(error.localizedDescription)"
        case .provisionFailed(let code):
            return "Server error (\(code)). Please try again."
        case .networkError:
            return "Network unavailable. Your data is safe offline."
        case .signOutFailed(let error):
            return "Sign out error: \(error.localizedDescription)"
        }
    }
    
    public var isNonFatal: Bool {
        switch self {
        case .networkError, .provisionFailed:
            return true
        default:
            return false
        }
    }
}
