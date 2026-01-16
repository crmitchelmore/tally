import SwiftUI
import Observation

/// Manages authentication state for the app
/// Uses Clerk iOS SDK when available, falls back to mock for development
@Observable
final class AuthManager {
    static let shared = AuthManager()
    
    var isAuthenticated = false
    var isLoading = false
    var currentUser: AuthUser?
    var error: String?
    
    private init() {}
    
    // MARK: - Public API
    
    func signIn(email: String, password: String) async {
        isLoading = true
        error = nil
        
        do {
            // In production, this would use Clerk SDK:
            // try await Clerk.shared.signIn.create(strategy: .password(email: email, password: password))
            
            // For now, simulate auth with API
            try await Task.sleep(nanoseconds: 500_000_000) // 0.5s delay
            
            // Create mock user
            currentUser = AuthUser(
                id: "user_\(UUID().uuidString.prefix(8))",
                email: email,
                name: email.components(separatedBy: "@").first,
                avatarUrl: nil
            )
            
            // Register with backend
            await APIClient.shared.setAuthToken(currentUser?.id)
            try? await APIClient.shared.registerUser(
                email: currentUser?.email,
                name: currentUser?.name,
                avatarUrl: currentUser?.avatarUrl
            )
            
            isAuthenticated = true
        } catch {
            self.error = "Sign in failed. Please check your credentials."
        }
        
        isLoading = false
    }
    
    func signUp(email: String, password: String, name: String?) async {
        isLoading = true
        error = nil
        
        do {
            // In production, this would use Clerk SDK:
            // try await Clerk.shared.signUp.create(strategy: .standard(email: email, password: password))
            
            try await Task.sleep(nanoseconds: 500_000_000)
            
            currentUser = AuthUser(
                id: "user_\(UUID().uuidString.prefix(8))",
                email: email,
                name: name ?? email.components(separatedBy: "@").first,
                avatarUrl: nil
            )
            
            await APIClient.shared.setAuthToken(currentUser?.id)
            try? await APIClient.shared.registerUser(
                email: currentUser?.email,
                name: currentUser?.name,
                avatarUrl: currentUser?.avatarUrl
            )
            
            isAuthenticated = true
        } catch {
            self.error = "Sign up failed. Please try again."
        }
        
        isLoading = false
    }
    
    func signOut() {
        currentUser = nil
        isAuthenticated = false
        Task {
            await APIClient.shared.setAuthToken(nil)
        }
    }
    
    func checkSession() async {
        // In production, check Clerk session
        // For now, check if we have a stored token
        isLoading = true
        
        // Simulate session check
        try? await Task.sleep(nanoseconds: 300_000_000)
        
        // No persisted session in mock mode
        isLoading = false
    }
}

// MARK: - Auth User Model

struct AuthUser: Identifiable, Codable {
    let id: String
    let email: String?
    let name: String?
    let avatarUrl: String?
}
