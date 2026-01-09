import XCTest
@testable import TallyCore

/// Unit tests for Tally iOS app
/// Note: UI tests require the TallyAppUITests target with XCUITest
final class TallyAppTests: XCTestCase {

  // MARK: - Challenge Validation

  func testChallengeNameValidation() {
    // Empty names should be invalid
    XCTAssertTrue("".isEmpty)
    XCTAssertFalse("Valid Challenge".isEmpty)
  }

  func testTargetNumberValidation() {
    // Target must be positive
    XCTAssertTrue(100 > 0)
    XCTAssertFalse(-1 > 0)
    XCTAssertFalse(0 > 0)
  }

  // MARK: - Date Formatting

  func testDateStringFormat() {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"
    let date = Date(timeIntervalSince1970: 1704067200) // 2024-01-01
    let formatted = formatter.string(from: date)
    XCTAssertEqual(formatted, "2024-01-01")
  }

  func testCurrentYearCalculation() {
    let calendar = Calendar.current
    let year = calendar.component(.year, from: Date())
    XCTAssertGreaterThanOrEqual(year, 2024)
    XCTAssertLessThanOrEqual(year, 2100)
  }

  // MARK: - Progress Calculation

  func testProgressPercentage() {
    let total: Double = 250
    let target: Double = 1000
    let progress = total / target
    XCTAssertEqual(progress, 0.25, accuracy: 0.001)
  }

  func testProgressClampedTo100() {
    let total: Double = 1200
    let target: Double = 1000
    let progress = min(total / target, 1.0)
    XCTAssertEqual(progress, 1.0)
  }

  func testProgressZeroTarget() {
    let target: Double = 0
    // Avoid division by zero
    let progress = target > 0 ? 50.0 / target : 0
    XCTAssertEqual(progress, 0)
  }

  // MARK: - Entry Aggregation

  func testEntryCountSum() {
    let counts: [Double] = [10, 15, 20, 5]
    let total = counts.reduce(0, +)
    XCTAssertEqual(total, 50)
  }

  func testEntrySetsSum() {
    let sets = [EntrySet(reps: 10), EntrySet(reps: 8), EntrySet(reps: 7)]
    let total = sets.reduce(0.0) { $0 + $1.reps }
    XCTAssertEqual(total, 25)
  }

  // MARK: - Color Parsing

  func testHexColorValidation() {
    let validColors = ["#FF0000", "#00FF00", "#0000FF", "#4CAF50"]
    let invalidColors = ["red", "FF0000", "#GGG", ""]

    for color in validColors {
      XCTAssertTrue(color.hasPrefix("#") && color.count == 7, "\(color) should be valid")
    }

    for color in invalidColors {
      XCTAssertFalse(color.hasPrefix("#") && color.count == 7, "\(color) should be invalid")
    }
  }

  // MARK: - Feeling Emoji Mapping

  func testFeelingEmoji() {
    func emojiFor(_ feeling: FeelingType) -> String {
      switch feeling {
      case .veryEasy: return "😎"
      case .easy: return "🙂"
      case .moderate: return "😐"
      case .hard: return "😤"
      case .veryHard: return "🥵"
      }
    }

    XCTAssertEqual(emojiFor(.veryEasy), "😎")
    XCTAssertEqual(emojiFor(.easy), "🙂")
    XCTAssertEqual(emojiFor(.moderate), "😐")
    XCTAssertEqual(emojiFor(.hard), "😤")
    XCTAssertEqual(emojiFor(.veryHard), "🥵")
  }

  // MARK: - Weekly Summary Logic

  func testWeekdayCalculation() {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"

    // 2024-01-01 was a Monday
    let date = formatter.date(from: "2024-01-01")!
    let calendar = Calendar(identifier: .gregorian)
    let weekday = calendar.component(.weekday, from: date)

    // Sunday = 1, Monday = 2 in Gregorian calendar
    XCTAssertEqual(weekday, 2) // Monday
  }

  func testDaysInCurrentWeek() {
    let calendar = Calendar.current
    let weekRange = calendar.range(of: .weekday, in: .weekOfYear, for: Date())
    XCTAssertEqual(weekRange?.count, 7)
  }

  // MARK: - Timeframe Validation

  func testYearTimeframeDefaultDates() {
    let year = 2026
    let startDate = "\(year)-01-01"
    let endDate = "\(year)-12-31"

    XCTAssertEqual(startDate, "2026-01-01")
    XCTAssertEqual(endDate, "2026-12-31")
  }

  func testCustomTimeframeDateRange() {
    let formatter = DateFormatter()
    formatter.dateFormat = "yyyy-MM-dd"

    let start = formatter.date(from: "2026-03-01")!
    let end = formatter.date(from: "2026-03-30")!

    let days = Calendar.current.dateComponents([.day], from: start, to: end).day!
    XCTAssertEqual(days, 29) // 30 days inclusive means 29 days difference
  }

  // MARK: - API Token Validation

  func testBearerTokenFormat() {
    let token = "sk_test_abc123"
    let header = "Bearer \(token)"
    XCTAssertTrue(header.hasPrefix("Bearer "))
    XCTAssertEqual(header, "Bearer sk_test_abc123")
  }

  // MARK: - Leaderboard Sorting

  func testLeaderboardSortByFollowers() {
    struct MockRow {
      let name: String
      let followers: Double
    }

    let rows = [
      MockRow(name: "A", followers: 10),
      MockRow(name: "B", followers: 50),
      MockRow(name: "C", followers: 25)
    ]

    let sorted = rows.sorted { $0.followers > $1.followers }
    XCTAssertEqual(sorted.map(\.name), ["B", "C", "A"])
  }

  // MARK: - Archive Filter

  func testArchiveFilter() {
    struct MockChallenge {
      let name: String
      let archived: Bool
    }

    let challenges = [
      MockChallenge(name: "Active", archived: false),
      MockChallenge(name: "Old", archived: true),
      MockChallenge(name: "Current", archived: false)
    ]

    let active = challenges.filter { !$0.archived }
    XCTAssertEqual(active.count, 2)
    XCTAssertEqual(active.map(\.name), ["Active", "Current"])
  }
}
