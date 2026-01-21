import Foundation

/// App configuration loaded from Info.plist or environment
public enum Configuration {
    /// Production Clerk publishable key (safe to embed - it's public)
    private static let productionClerkKey = "pk_live_Y2xlcmsudGFsbHktdHJhY2tlci5hcHAk"
    
    /// Clerk publishable key for authentication
    public static var clerkPublishableKey: String {
        // Read from Info.plist (set via build settings)
        if let key = Bundle.main.object(forInfoDictionaryKey: "CLERK_PUBLISHABLE_KEY") as? String,
           !key.isEmpty, !key.hasPrefix("$(") {
            return key
        }
        // Fallback to production key for dev builds
        return productionClerkKey
    }
    
    /// API base URL
    public static var apiBaseURL: String {
        if let url = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String,
           !url.isEmpty, !url.hasPrefix("$(") {
            return url
        }
        return ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "https://tally-tracker.app"
    }
    
    /// Whether we're in a valid configured state
    public static var isConfigured: Bool {
        !clerkPublishableKey.isEmpty
    }
}
