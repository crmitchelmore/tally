import SwiftUI
import TallyCore
import Clerk
import os.log

private let logger = Logger(subsystem: "com.tally.app", category: "AuthManager")

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
    
    /// Key for storing offline mode preference
    private static let offlineModeKey = "tally.offlineMode"
    
    /// Whether user has chosen to use offline mode
    public var prefersOfflineMode: Bool {
        get { UserDefaults.standard.bool(forKey: Self.offlineModeKey) }
        set { UserDefaults.standard.set(newValue, forKey: Self.offlineModeKey) }
    }
    
    private var clerk: Clerk { Clerk.shared }
    
    private init() {
        // Check for test reset flag
        if CommandLine.arguments.contains("--reset-offline-mode") {
            print("[AuthManager] Resetting offline mode for testing")
            UserDefaults.standard.removeObject(forKey: Self.offlineModeKey)
        }
    }
    
    /// Configure Clerk with the publishable key
    public func configure() async {
        print("[AuthManager] configure() called")
        
        // Check if user previously chose offline mode
        if prefersOfflineMode {
            print("[AuthManager] prefersOfflineMode is true, using local-only mode")
            isLocalOnlyMode = true
            isLoading = false
            return
        }
        
        guard Configuration.isConfigured else {
            // No auth configured - run in local-only mode
            print("[AuthManager] Configuration not set, using local-only mode")
            isLocalOnlyMode = true
            isLoading = false
            return
        }
        
        do {
            print("[AuthManager] Configuring Clerk with key: \(String(Configuration.clerkPublishableKey.prefix(20)))...")
            try await clerk.configure(publishableKey: Configuration.clerkPublishableKey)
            print("[AuthManager] Clerk configured, loading...")
            try await clerk.load()
            print("[AuthManager] Clerk loaded, session: \(clerk.session?.id ?? "nil"), user: \(clerk.user?.id ?? "nil")")
            await updateAuthState()
        } catch {
            print("[AuthManager] Clerk error: \(error)")
            self.error = .clerkError(error)
            isLoading = false
        }
    }
    
    /// Enable offline/local-only mode (user choice)
    public func enableOfflineMode() {
        prefersOfflineMode = true
        isLocalOnlyMode = true
        isAuthenticated = false
        currentUser = nil
        isLoading = false
    }
    
    /// Disable offline mode and try to authenticate
    public func disableOfflineMode() async {
        prefersOfflineMode = false
        isLocalOnlyMode = false
        isLoading = true
        await configure()
    }
    
    /// Update local auth state from Clerk
    public func updateAuthState() async {
        isLoading = true
        print("[AuthManager] updateAuthState called")
        
        if let clerkUser = clerk.user {
            print("[AuthManager] Found clerk user: \(clerkUser.id)")
            currentUser = TallyUser(
                id: clerkUser.id,
                email: clerkUser.primaryEmailAddress?.emailAddress,
                firstName: clerkUser.firstName,
                lastName: clerkUser.lastName,
                imageUrl: clerkUser.imageUrl
            )
            
            // Sync token to Keychain and provision user BEFORE marking as authenticated
            await syncTokenAndProvisionUser()
            isAuthenticated = true
            print("[AuthManager] isAuthenticated set to true")
        } else {
            print("[AuthManager] No clerk user found")
            isAuthenticated = false
            currentUser = nil
            KeychainService.shared.deleteToken()
        }
        
        isLoading = false
    }
    
    /// Sync the session token to Keychain and call /api/v1/auth/user
    private func syncTokenAndProvisionUser() async {
        guard let session = clerk.session else {
            print("[AuthManager] No clerk session available")
            logger.warning("No clerk session available")
            return
        }
        
        do {
            // Get the session token
            let tokenResult = try await session.getToken()
            if let token = tokenResult?.jwt {
                print("[AuthManager] Got token from Clerk: \(String(token.prefix(20)))...")
                logger.info("Got token from Clerk: \(String(token.prefix(20)))...")
                try KeychainService.shared.storeToken(token)
                print("[AuthManager] Token stored in Keychain")
                logger.info("Token stored in Keychain")
                
                // Provision user via API
                await provisionUser(token: token)
            } else {
                print("[AuthManager] No JWT in token result")
                logger.warning("No JWT in token result")
            }
        } catch {
            print("[AuthManager] Token sync error: \(error.localizedDescription)")
            logger.error("Token sync error: \(error.localizedDescription)")
            self.error = .tokenSyncFailed(error)
        }
    }
    
    /// Call POST /api/v1/auth/user to ensure user exists in backend
    private func provisionUser(token: String) async {
        let urlString = "\(Configuration.apiBaseURL)/api/v1/auth/user"
        print("[AuthManager] Provisioning user at \(urlString)")
        logger.info("Provisioning user at \(urlString)")
        
        guard let url = URL(string: urlString) else {
            return
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            if let httpResponse = response as? HTTPURLResponse {
                print("[AuthManager] Provision response: \(httpResponse.statusCode)")
                logger.info("Provision response: \(httpResponse.statusCode)")
                if let body = String(data: data, encoding: .utf8) {
                    print("[AuthManager] Response body: \(body)")
                    logger.debug("Response body: \(body)")
                }
                if !(200...299).contains(httpResponse.statusCode) {
                    self.error = .provisionFailed(httpResponse.statusCode)
                }
            }
        } catch {
            print("[AuthManager] Provision network error: \(error.localizedDescription)")
            logger.error("Provision network error: \(error.localizedDescription)")
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
