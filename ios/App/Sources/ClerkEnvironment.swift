import Foundation

enum ClerkEnvironment {
    static func publishableKey() throws -> String {
        let isCI = ProcessInfo.processInfo.environment["CI"] != nil
        let infoKey = Bundle.main.object(forInfoDictionaryKey: "ClerkPublishableKey") as? String
        let fallbackKey = ProcessInfo.processInfo.environment["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"]
            ?? ProcessInfo.processInfo.environment["CLERK_PUBLISHABLE_KEY"]
        let candidate = infoKey ?? fallbackKey
        guard let key = candidate?.trimmingCharacters(in: .whitespacesAndNewlines),
              !key.isEmpty
        else {
            if isCI { return "pk_test_placeholder_for_ci" }
            throw ClerkEnvironmentError.missingPublishableKey
        }
        return key
    }

    static func apiBaseURL() throws -> URL {
        let isCI = ProcessInfo.processInfo.environment["CI"] != nil
        let infoDeployment = Bundle.main.object(forInfoDictionaryKey: "ConvexDeployment") as? String
        let fallbackDeployment = ProcessInfo.processInfo.environment["CONVEX_DEPLOYMENT"]
        let deployment = infoDeployment ?? fallbackDeployment
        let trimmed = deployment?.trimmingCharacters(in: .whitespacesAndNewlines)
        let value = (trimmed?.isEmpty == false ? trimmed : (isCI ? "dev" : nil))
        guard let value else {
            throw ClerkEnvironmentError.missingDeployment
        }
        let urlString = "https://\(value).convex.site/api/v1"
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

extension ClerkEnvironment {
    static func telemetryEnvironment() -> String {
        let env = Bundle.main.object(forInfoDictionaryKey: "TelemetryEnvironment") as? String
        return env?.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty == false ? env! : "development"
    }
}
