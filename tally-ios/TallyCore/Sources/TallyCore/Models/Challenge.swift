import Foundation

public struct Challenge: Codable, Sendable, Identifiable {
  public let _id: String
  public let userId: String
  public let name: String
  public let targetNumber: Double
  public let year: Double
  public let color: String
  public let icon: String
  public let timeframeUnit: TimeframeUnit
  public let startDate: String?
  public let endDate: String?
  public let isPublic: Bool
  public let archived: Bool
  public let createdAt: Double

  public var id: String { _id }

  public init(
    _id: String,
    userId: String,
    name: String,
    targetNumber: Double,
    year: Double,
    color: String,
    icon: String,
    timeframeUnit: TimeframeUnit,
    startDate: String?,
    endDate: String?,
    isPublic: Bool,
    archived: Bool,
    createdAt: Double
  ) {
    self._id = _id
    self.userId = userId
    self.name = name
    self.targetNumber = targetNumber
    self.year = year
    self.color = color
    self.icon = icon
    self.timeframeUnit = timeframeUnit
    self.startDate = startDate
    self.endDate = endDate
    self.isPublic = isPublic
    self.archived = archived
    self.createdAt = createdAt
  }
}
