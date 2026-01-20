import Foundation

/// Errors that can occur during API operations
public enum APIError: Error, LocalizedError, Sendable {
    case notAuthenticated
    case invalidURL
    case networkError(Error)
    case httpError(statusCode: Int, message: String?)
    case decodingError(Error)
    case encodingError(Error)
    case serverError(String)
    case forbidden(String)
    case notFound(String)
    case validationFailed(String, details: [String: String]?)
    case unknown
    
    public var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "Not authenticated. Please sign in."
        case .invalidURL:
            return "Invalid URL configuration."
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .httpError(let statusCode, let message):
            if let msg = message {
                return "HTTP \(statusCode): \(msg)"
            }
            return "HTTP error \(statusCode)"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .encodingError(let error):
            return "Failed to encode request: \(error.localizedDescription)"
        case .serverError(let message):
            return "Server error: \(message)"
        case .forbidden(let message):
            return "Access denied: \(message)"
        case .notFound(let message):
            return "Not found: \(message)"
        case .validationFailed(let message, _):
            return "Validation failed: \(message)"
        case .unknown:
            return "An unknown error occurred."
        }
    }
    
    /// Whether this error is recoverable (user can retry)
    public var isRecoverable: Bool {
        switch self {
        case .networkError, .httpError(statusCode: 500...599, _), .serverError, .unknown:
            return true
        default:
            return false
        }
    }
    
    /// Whether user needs to re-authenticate
    public var requiresReauth: Bool {
        switch self {
        case .notAuthenticated, .httpError(statusCode: 401, _):
            return true
        default:
            return false
        }
    }
}
