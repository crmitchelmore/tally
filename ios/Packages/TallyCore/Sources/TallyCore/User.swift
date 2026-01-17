import Foundation

public struct User: Equatable, Sendable {
    public let id: UUID
    public let email: String
    public let displayName: String

    public init(id: UUID, email: String, displayName: String) {
        self.id = id
        self.email = email
        self.displayName = displayName
    }
}
