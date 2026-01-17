import Foundation

public enum AuthError: LocalizedError, Equatable {
    case missingSession
    case missingToken
    case invalidToken
    case invalidUser
    case missingUser
    case missingBaseURL
    case invalidResponse

    public var errorDescription: String? {
        switch self {
        case .missingSession:
            return "Missing active session."
        case .missingToken:
            return "Missing auth token."
        case .invalidToken:
            return "Invalid auth token."
        case .invalidUser:
            return "Invalid user profile."
        case .missingUser:
            return "User is signed out."
        case .missingBaseURL:
            return "Missing API base URL."
        case .invalidResponse:
            return "Invalid server response."
        }
    }
}
