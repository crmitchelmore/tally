import Foundation

/// Represents the authenticated user from /api/v1/auth/user
public struct TallyUser: Codable, Equatable, Sendable {
    public let id: String
    public let email: String?
    public let firstName: String?
    public let lastName: String?
    public let imageUrl: String?
    public let createdAt: Date?
    public let updatedAt: Date?
    
    public init(
        id: String,
        email: String? = nil,
        firstName: String? = nil,
        lastName: String? = nil,
        imageUrl: String? = nil,
        createdAt: Date? = nil,
        updatedAt: Date? = nil
    ) {
        self.id = id
        self.email = email
        self.firstName = firstName
        self.lastName = lastName
        self.imageUrl = imageUrl
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    public var displayName: String {
        if let first = firstName, !first.isEmpty {
            if let last = lastName, !last.isEmpty {
                return "\(first) \(last)"
            }
            return first
        }
        return email ?? "User"
    }
}
