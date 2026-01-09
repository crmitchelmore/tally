import Foundation

public struct EntrySet: Codable, Sendable {
  public let reps: Double

  public init(reps: Double) {
    self.reps = reps
  }
}

public struct Entry: Codable, Sendable, Identifiable {
  public let _id: String
  public let userId: String
  public let challengeId: String
  public let date: String
  public let count: Double
  public let note: String?
  public let sets: [EntrySet]?
  public let feeling: FeelingType?
  public let createdAt: Double

  public var id: String { _id }

  public init(
    _id: String,
    userId: String,
    challengeId: String,
    date: String,
    count: Double,
    note: String?,
    sets: [EntrySet]?,
    feeling: FeelingType?,
    createdAt: Double
  ) {
    self._id = _id
    self.userId = userId
    self.challengeId = challengeId
    self.date = date
    self.count = count
    self.note = note
    self.sets = sets
    self.feeling = feeling
    self.createdAt = createdAt
  }
}
