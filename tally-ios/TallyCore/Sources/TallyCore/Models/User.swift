import Foundation

public struct User: Codable, Sendable, Identifiable {
  public let _id: String
  public let clerkId: String
  public let email: String?
  public let name: String?
  public let avatarUrl: String?
  public let createdAt: Double

  public var id: String { _id }

  public init(
    _id: String,
    clerkId: String,
    email: String?,
    name: String?,
    avatarUrl: String?,
    createdAt: Double
  ) {
    self._id = _id
    self.clerkId = clerkId
    self.email = email
    self.name = name
    self.avatarUrl = avatarUrl
    self.createdAt = createdAt
  }
}
