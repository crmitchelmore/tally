import Foundation

enum ClerkEnvironment {
    static func publishableKey() throws -> String {
        guard let key = Bundle.main.object(forInfoDictionaryKey: "ClerkPublishableKey") as? String,
              !key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        else {
            throw ClerkEnvironmentError.missingPublishableKey
        }
        return key
    }

    static func apiBaseURL() throws -> URL {
        guard let deployment = Bundle.main.object(forInfoDictionaryKey: "ConvexDeployment") as? String,
              !deployment.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
        else {
            throw ClerkEnvironmentError.missingDeployment
        }
        let urlString = "https://\(deployment).convex.site/api/v1"
        guard let url = URL(string: urlString) else {
            throw ClerkEnvironmentError.invalidBaseURL
        }
        return url
    }
}

enum ClerkEnvironmentError: LocalizedError {
    case missingPublishableKey
    case missingDeployment
    case invalidBaseURL

    var errorDescription: String? {
        switch self {
        case .missingPublishableKey:
            return "Missing Clerk publishable key."
        case .missingDeployment:
            return "Missing Convex deployment."
        case .invalidBaseURL:
            return "Invalid API base URL."
        }
    }
}
