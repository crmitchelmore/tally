import Foundation

/// Protocol for refreshing authentication tokens
/// This allows APIClient to request token refresh without depending on TallyFeatureAuth
@MainActor
public protocol TokenRefresher {
    /// Refresh the current session token
    /// - Returns: The new token if refresh succeeded, nil otherwise
    func refreshToken() async -> String?
}

/// Global token refresher instance
/// Set by AuthManager during initialization
public var tokenRefresher: TokenRefresher?
