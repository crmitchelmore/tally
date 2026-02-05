import ProjectDescription

/// Custom environment variables for the Tally project.
public extension Environment {
    /// Clerk publishable key (CLERK_PUBLISHABLE_KEY).
    static var clerkPublishableKey: Environment.Value? {
        Environment.CLERK_PUBLISHABLE_KEY
    }
    
    /// API base URL (API_BASE_URL).
    static var apiBaseURL: Environment.Value? {
        Environment.API_BASE_URL
    }
    
    /// Development team ID (DEVELOPMENT_TEAM).
    static var developmentTeam: Environment.Value? {
        Environment.DEVELOPMENT_TEAM
    }
    
    /// Provisioning profile specifier (PROVISIONING_PROFILE_SPECIFIER).
    static var provisioningProfileSpecifier: Environment.Value? {
        Environment.PROVISIONING_PROFILE_SPECIFIER
    }
    
    /// Code sign identity (CODE_SIGN_IDENTITY).
    static var codeSignIdentity: Environment.Value? {
        Environment.CODE_SIGN_IDENTITY
    }
    
    /// Git commit SHA (GIT_COMMIT_SHA).
    static var gitCommitSha: Environment.Value? {
        Environment.GIT_COMMIT_SHA
    }
}
