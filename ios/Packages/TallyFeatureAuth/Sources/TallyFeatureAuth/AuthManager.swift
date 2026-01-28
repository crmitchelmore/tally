import SwiftUI
import TallyCore
import Clerk
import os.log
import TallyFeatureAPIClient

private let logger = Logger(subsystem: "com.tally.app", category: "AuthManager")

/// Authentication state manager using Clerk
@MainActor
@Observable
public final class AuthManager: TokenRefresher {
    public static let shared = AuthManager()
    
    public private(set) var isLoading = true
    public private(set) var isAuthenticated = false
    public private(set) var isLocalOnlyMode = false
    public private(set) var currentUser: TallyUser?
    public private(set) var error: AuthError?
    
    /// Result of data check when transitioning from local-only to authenticated
    public private(set) var serverDataCheckResult: ServerDataCheckResult?
    
    /// Key for storing offline mode preference
    private static let offlineModeKey = "tally.offlineMode"
    
    /// Whether user has chosen to use offline mode
    public var prefersOfflineMode: Bool {
        get { UserDefaults.standard.bool(forKey: Self.offlineModeKey) }
        set { UserDefaults.standard.set(newValue, forKey: Self.offlineModeKey) }
    }
    
    private var clerk: Clerk { Clerk.shared }
    
    private init() {
        // Set global token refresher for APIClient
        TallyFeatureAPIClient.tokenRefresher = self

        // Check for test reset flag
        if CommandLine.arguments.contains("--reset-offline-mode") {
            print("[AuthManager] Resetting offline mode for testing")
            UserDefaults.standard.removeObject(forKey: Self.offlineModeKey)
        }
        
        // Check for offline mode flag (for UI tests)
        if CommandLine.arguments.contains("--offline-mode") {
            print("[AuthManager] --offline-mode flag detected, enabling offline mode")
            prefersOfflineMode = true
        }
        
        // Check for clear data flag (for UI tests)
        if CommandLine.arguments.contains("--clear-data") {
            print("[AuthManager] Clearing all data for testing")
            // Clear challenges local store
            UserDefaults.standard.removeObject(forKey: "tally.challenges.data")
            UserDefaults.standard.removeObject(forKey: "tally.challenges.pending")
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
    /// Returns true if authentication succeeded, false if user cancelled
    public func disableOfflineMode() async -> Bool {
        prefersOfflineMode = false
        isLocalOnlyMode = false
        isLoading = true
        await configure()
        
        // If authentication succeeded, check for server data
        if isAuthenticated {
            await checkServerData()
            return true
        }
        return false
    }
    
    /// Check if the authenticated account has existing data on the server
    private func checkServerData() async {
        print("[AuthManager] Checking server for existing data...")
        logger.info("Checking server for existing data...")
        
        do {
            let challenges = try await APIClient.shared.listChallenges(includeArchived: true)
            let entries = try await APIClient.shared.listEntries()
            
            let hasServerData = !challenges.isEmpty || !entries.isEmpty
            serverDataCheckResult = ServerDataCheckResult(
                hasData: hasServerData,
                challengeCount: challenges.count,
                entryCount: entries.count
            )
            
            print("[AuthManager] Server has \(challenges.count) challenges, \(entries.count) entries")
            logger.info("Server has \(challenges.count) challenges, \(entries.count) entries")
        } catch {
            print("[AuthManager] Failed to check server data: \(error)")
            logger.error("Failed to check server data: \(error.localizedDescription)")
            // Don't set error here - this is non-critical
            serverDataCheckResult = nil
        }
    }
    
    /// Import local data to server (called when user chooses to sync local data after login)
    /// NOTE: Not yet implemented - API endpoint and types needed
    public func syncLocalDataToServer(localChallenges: [Challenge], localEntries: [Entry]) async throws {
        print("[AuthManager] syncLocalDataToServer: Not yet implemented")
        logger.warning("syncLocalDataToServer: Not yet implemented - need import API endpoint")
        // TODO: Implement when /api/v1/import endpoint is ready
        // For now, this is a no-op - data stays local until manually created on server
    }
    
    /// Merge local and server data (called when user chooses to merge)
    /// NOTE: Not yet implemented - API endpoint and types needed
    public func mergeLocalAndServerData(localChallenges: [Challenge], localEntries: [Entry]) async throws {
        print("[AuthManager] mergeLocalAndServerData: Not yet implemented")
        logger.warning("mergeLocalAndServerData: Not yet implemented - need import API endpoint")
        // TODO: Implement when /api/v1/import endpoint is ready
        // For now, this is a no-op - data stays local until manually created on server
    }
    
    /// Discard local data and use only server data (called when user chooses "Start Fresh")
    public func useServerDataOnly() {
        print("[AuthManager] Discarding local data, will use server data only")
        logger.info("Discarding local data, will use server data only")
        // The ChallengeStore will handle fetching server data
        // We just need to clear the local data
    }
    
    /// Clear the server data check result
    public func clearServerDataCheck() {
        serverDataCheckResult = nil
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
    
    
    /// Refresh the session token from Clerk
    public func refreshToken() async -> String? {
        guard let session = clerk.session else {
            logger.warning("No clerk session available for refresh")
            return nil
        }
        do {
            let tokenResult = try await session.getToken()
            if let token = tokenResult?.jwt {
                logger.info("Token refreshed successfully")
                try KeychainService.shared.storeToken(token)
                return token
            } else {
                logger.warning("No JWT in token refresh result")
            }
        } catch {
            logger.error("Token refresh error: \(error.localizedDescription)")
        }
        return nil
    }
    /// Sign out the current user - not used in iOS but kept for compatibility
    public func signOut() async {
        do {
            try await clerk.signOut()
            isAuthenticated = false
            currentUser = nil
            serverDataCheckResult = nil
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

/// Result of checking server for existing data
public struct ServerDataCheckResult {
    public let hasData: Bool
    public let challengeCount: Int
    public let entryCount: Int
}
