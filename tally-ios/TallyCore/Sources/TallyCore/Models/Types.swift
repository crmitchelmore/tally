import Foundation

public enum TimeframeUnit: String, Codable, Sendable {
  case year
  case month
  case custom
}

public enum FeelingType: String, Codable, Sendable {
  case veryEasy = "very-easy"
  case easy
  case moderate
  case hard
  case veryHard = "very-hard"
}
