import Foundation

public struct FollowedChallenge: Codable, Sendable, Identifiable {
  public let _id: String
  public let userId: String
  public let challengeId: String
  public let followedAt: Double

  public var id: String { _id }

  public init(_id: String, userId: String, challengeId: String, followedAt: Double) {
    self._id = _id
    self.userId = userId
    self.challengeId = challengeId
    self.followedAt = followedAt
  }
}
