import SwiftUI
import Observation
import Clerk

/// Manages authentication state for the app using Clerk iOS SDK
@Observable
@MainActor
final class AuthManager {
    static let shared = AuthManager()
    
    var isAuthenticated = false
    var isLoading = false
    var isClerkReady = false
    var currentUser: AuthUser?
    var error: String?
    
    private init() {}
    
    // MARK: - Clerk Setup
    
    func initializeClerk() async {
        isLoading = true
        
        // Configure Clerk
        Clerk.shared.configure(publishableKey: "pk_live_Y2xlcmsudGFsbHktdHJhY2tlci5hcHAk")
        
        do {
            try await Clerk.shared.load()
            isClerkReady = true
            print("Clerk loaded successfully")
        } catch {
            print("Failed to load Clerk: \(error)")
            self.error = "Failed to initialize authentication"
        }
        
        // Check for existing session after Clerk is ready
        if isClerkReady {
            await checkSession()
        }
        
        isLoading = false
    }
    
    // MARK: - Public API
    
    func signIn(email: String, password: String) async {
        guard isClerkReady else {
            self.error = "Authentication not ready. Please wait..."
            return
        }
        
        isLoading = true
        error = nil
        
        do {
            // Create sign-in attempt with email/password
            let signIn = try await SignIn.create(
                strategy: .identifier(email, password: password)
            )
            
            // Check if sign-in is complete
            if signIn.status == .complete {
                await handleSuccessfulAuth()
            } else if signIn.status == .needsFirstFactor {
                // May need to attempt first factor with password
                let result = try await signIn.attemptFirstFactor(strategy: .password(password: password))
                if result.status == .complete {
                    await handleSuccessfulAuth()
                } else {
                    self.error = "Sign in requires additional verification"
                }
            } else {
                self.error = "Sign in requires additional verification"
            }
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func signUp(email: String, password: String, name: String?) async {
        guard isClerkReady else {
            self.error = "Authentication not ready. Please wait..."
            return
        }
        
        isLoading = true
        error = nil
        
        do {
            // Create sign-up with email and password
            let signUp = try await SignUp.create(
                strategy: .standard(emailAddress: email, password: password)
            )
            
            if signUp.status == .complete {
                await handleSuccessfulAuth()
            } else {
                // May need email verification
                self.error = "Please check your email to verify your account"
            }
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func signInWithGoogle() async {
        guard isClerkReady else {
            self.error = "Authentication not ready. Please wait..."
            return
        }
        
        isLoading = true
        error = nil
        
        do {
            // OAuth sign-in with redirect for Google
            try await SignIn.authenticateWithRedirect(strategy: .oauth(provider: .google))
            await handleSuccessfulAuth()
        } catch {
            self.error = error.localizedDescription
        }
        
        isLoading = false
    }
    
    func signOut() {
        Task {
            do {
                try await Clerk.shared.signOut()
            } catch {
                print("Sign out error: \(error)")
            }
        }
        currentUser = nil
        isAuthenticated = false
        Task {
            await APIClient.shared.setAuthToken(nil)
        }
    }
    
    func checkSession() async {
        guard isClerkReady else { return }
        
        // Check for existing Clerk session
        if let session = Clerk.shared.session, session.status == .active {
            await handleSuccessfulAuth()
        }
    }
    
    // MARK: - Private
    
    private func handleSuccessfulAuth() async {
        guard let user = Clerk.shared.user else {
            self.error = "Failed to get user info"
            return
        }
        
        currentUser = AuthUser(
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            name: [user.firstName, user.lastName].compactMap { $0 }.joined(separator: " "),
            avatarUrl: user.imageUrl
        )
        
        // Get session token for API calls
        if let session = Clerk.shared.session,
           let token = try? await session.getToken() {
            await APIClient.shared.setAuthToken(token.jwt)
        } else {
            // Fallback to using user ID if token not available
            await APIClient.shared.setAuthToken(user.id)
        }
        
        // Register with backend
        try? await APIClient.shared.registerUser(
            email: currentUser?.email,
            name: currentUser?.name,
            avatarUrl: currentUser?.avatarUrl
        )
        
        isAuthenticated = true
    }
}

// MARK: - Auth User Model

struct AuthUser: Identifiable, Codable {
    let id: String
    let email: String?
    let name: String?
    let avatarUrl: String?
}
