import XCTest
@testable import TallyCore

final class TallyCoreTests: XCTestCase {
  // MARK: - Types

  func testFeelingTypeDecodes() throws {
    let data = try JSONEncoder().encode(["feeling": "very-easy"])

    struct Wrapper: Codable { let feeling: FeelingType }
    let decoded = try JSONDecoder().decode(Wrapper.self, from: data)

    XCTAssertEqual(decoded.feeling, .veryEasy)
  }

  func testFeelingTypeAllValues() throws {
    let values: [FeelingType] = [.veryEasy, .easy, .moderate, .hard, .veryHard]
    let rawValues = ["very-easy", "easy", "moderate", "hard", "very-hard"]

    for (feeling, raw) in zip(values, rawValues) {
      XCTAssertEqual(feeling.rawValue, raw)
    }
  }

  func testTimeframeUnitAllValues() throws {
    XCTAssertEqual(TimeframeUnit.year.rawValue, "year")
    XCTAssertEqual(TimeframeUnit.month.rawValue, "month")
    XCTAssertEqual(TimeframeUnit.custom.rawValue, "custom")
  }

  // MARK: - Challenge Model

  func testChallengeDecodes() throws {
    let json = """
    {
      "_id": "ch_123",
      "userId": "u_123",
      "name": "Push-ups",
      "targetNumber": 1000,
      "year": 2026,
      "color": "#fff",
      "icon": "dumbbell",
      "timeframeUnit": "year",
      "startDate": null,
      "endDate": null,
      "isPublic": true,
      "archived": false,
      "createdAt": 1
    }
    """

    let decoded = try JSONDecoder().decode(Challenge.self, from: Data(json.utf8))
    XCTAssertEqual(decoded._id, "ch_123")
    XCTAssertEqual(decoded.timeframeUnit, .year)
  }

  func testChallengeWithCustomTimeframe() throws {
    let json = """
    {
      "_id": "ch_456",
      "userId": "u_123",
      "name": "30-day challenge",
      "targetNumber": 100,
      "year": 2026,
      "color": "#ff0000",
      "icon": "flame",
      "timeframeUnit": "custom",
      "startDate": "2026-01-01",
      "endDate": "2026-01-30",
      "isPublic": false,
      "archived": false,
      "createdAt": 1234567890
    }
    """

    let decoded = try JSONDecoder().decode(Challenge.self, from: Data(json.utf8))
    XCTAssertEqual(decoded.timeframeUnit, .custom)
    XCTAssertEqual(decoded.startDate, "2026-01-01")
    XCTAssertEqual(decoded.endDate, "2026-01-30")
    XCTAssertFalse(decoded.isPublic ?? true)
  }

  func testChallengeIdentifiable() throws {
    let json = """
    {"_id":"id1","userId":"u","name":"n","targetNumber":1,"year":2026,"color":"#000","icon":"x","timeframeUnit":"year","startDate":null,"endDate":null,"isPublic":false,"archived":false,"createdAt":1}
    """
    let challenge = try JSONDecoder().decode(Challenge.self, from: Data(json.utf8))
    XCTAssertEqual(challenge.id, "id1")
    XCTAssertEqual(challenge.id, challenge._id)
  }

  // MARK: - Entry Model

  func testEntryDecodes() throws {
    let json = """
    {
      "_id": "e_123",
      "userId": "u_1",
      "challengeId": "ch_1",
      "date": "2026-01-15",
      "count": 25,
      "note": "Morning workout",
      "sets": [{"reps": 10}, {"reps": 10}, {"reps": 5}],
      "feeling": "moderate",
      "createdAt": 1234567890
    }
    """

    let decoded = try JSONDecoder().decode(Entry.self, from: Data(json.utf8))
    XCTAssertEqual(decoded._id, "e_123")
    XCTAssertEqual(decoded.count, 25)
    XCTAssertEqual(decoded.note, "Morning workout")
    XCTAssertEqual(decoded.sets?.count, 3)
    XCTAssertEqual(decoded.feeling, .moderate)
  }

  func testEntryWithoutOptionalFields() throws {
    let json = """
    {"_id":"e_1","userId":"u","challengeId":"c","date":"2026-01-01","count":10,"note":null,"sets":null,"feeling":null,"createdAt":1}
    """

    let decoded = try JSONDecoder().decode(Entry.self, from: Data(json.utf8))
    XCTAssertNil(decoded.note)
    XCTAssertNil(decoded.sets)
    XCTAssertNil(decoded.feeling)
  }

  func testEntryIdentifiable() throws {
    let json = """
    {"_id":"entry_id","userId":"u","challengeId":"c","date":"2026-01-01","count":10,"note":null,"sets":null,"feeling":null,"createdAt":1}
    """
    let entry = try JSONDecoder().decode(Entry.self, from: Data(json.utf8))
    XCTAssertEqual(entry.id, "entry_id")
  }

  // MARK: - EntrySet Model

  func testEntrySetDecodes() throws {
    let json = """{"reps": 15}"""
    let decoded = try JSONDecoder().decode(EntrySet.self, from: Data(json.utf8))
    XCTAssertEqual(decoded.reps, 15)
  }

  func testEntrySetEncodes() throws {
    let set = EntrySet(reps: 20)
    let data = try JSONEncoder().encode(set)
    let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any]
    XCTAssertEqual(obj?["reps"] as? Double, 20)
  }

  // MARK: - API Request Encoding

  func testCreateEntryEncodes() throws {
    let req = TallyAPI.CreateEntryRequest(challengeId: "c", date: "2026-01-09", count: 5, feeling: .easy)
    let data = try JSONEncoder().encode(req)

    let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any]
    XCTAssertEqual(obj?["challengeId"] as? String, "c")
    XCTAssertEqual(obj?["date"] as? String, "2026-01-09")
    XCTAssertEqual(obj?["count"] as? Double, 5)
    XCTAssertEqual(obj?["feeling"] as? String, "easy")
  }

  func testCreateEntryWithSetsEncodes() throws {
    let sets = [EntrySet(reps: 10), EntrySet(reps: 8), EntrySet(reps: 7)]
    let req = TallyAPI.CreateEntryRequest(
      challengeId: "c1",
      date: "2026-02-01",
      count: 25,
      note: "Good session",
      sets: sets,
      feeling: .hard
    )
    let data = try JSONEncoder().encode(req)

    let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any]
    XCTAssertEqual(obj?["note"] as? String, "Good session")
    XCTAssertEqual((obj?["sets"] as? [[String: Any]])?.count, 3)
  }

  func testCreateChallengeEncodes() throws {
    let req = TallyAPI.CreateChallengeRequest(
      name: "Daily Push-ups",
      targetNumber: 1000,
      year: 2026,
      color: "#4CAF50",
      icon: "dumbbell",
      timeframeUnit: .year,
      isPublic: true
    )
    let data = try JSONEncoder().encode(req)

    let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any]
    XCTAssertEqual(obj?["name"] as? String, "Daily Push-ups")
    XCTAssertEqual(obj?["targetNumber"] as? Double, 1000)
    XCTAssertEqual(obj?["timeframeUnit"] as? String, "year")
    XCTAssertEqual(obj?["isPublic"] as? Bool, true)
  }

  func testCreateChallengeCustomTimeframe() throws {
    let req = TallyAPI.CreateChallengeRequest(
      name: "30-day Sprint",
      targetNumber: 300,
      year: 2026,
      color: "#FF5722",
      icon: "flame",
      timeframeUnit: .custom,
      startDate: "2026-03-01",
      endDate: "2026-03-30"
    )
    let data = try JSONEncoder().encode(req)

    let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any]
    XCTAssertEqual(obj?["timeframeUnit"] as? String, "custom")
    XCTAssertEqual(obj?["startDate"] as? String, "2026-03-01")
    XCTAssertEqual(obj?["endDate"] as? String, "2026-03-30")
  }

  func testUpdateChallengePartialEncodes() throws {
    let req = TallyAPI.UpdateChallengeRequest(isPublic: false, archived: true)
    let data = try JSONEncoder().encode(req)

    let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any]
    XCTAssertEqual(obj?["isPublic"] as? Bool, false)
    XCTAssertEqual(obj?["archived"] as? Bool, true)
    // Nil values should not be present or be null
  }

  func testUpdateEntryEncodes() throws {
    let req = TallyAPI.UpdateEntryRequest(count: 30, feeling: .veryHard)
    let data = try JSONEncoder().encode(req)

    let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any]
    XCTAssertEqual(obj?["count"] as? Double, 30)
    XCTAssertEqual(obj?["feeling"] as? String, "very-hard")
  }

  // MARK: - API Response Decoding

  func testIdResponseDecodes() throws {
    let json = """{"id": "new_id_123"}"""
    let decoded = try JSONDecoder().decode(TallyAPI.IdResponse.self, from: Data(json.utf8))
    XCTAssertEqual(decoded.id, "new_id_123")
  }

  func testSuccessResponseDecodes() throws {
    let json = """{"success": true}"""
    let decoded = try JSONDecoder().decode(TallyAPI.SuccessResponse.self, from: Data(json.utf8))
    XCTAssertTrue(decoded.success)
  }

  func testLeaderboardRowDecodes() throws {
    let json = """
    {
      "challenge": {
        "_id": "ch_pub",
        "userId": "u_1",
        "name": "Public Challenge",
        "targetNumber": 500,
        "year": 2026,
        "color": "#2196F3",
        "icon": "star",
        "timeframeUnit": "year",
        "startDate": null,
        "endDate": null,
        "isPublic": true,
        "archived": false,
        "createdAt": 1234567890
      },
      "followers": 42
    }
    """
    let decoded = try JSONDecoder().decode(TallyAPI.LeaderboardRow.self, from: Data(json.utf8))
    XCTAssertEqual(decoded.challenge.name, "Public Challenge")
    XCTAssertEqual(decoded.followers, 42)
  }

  // MARK: - FollowedChallenge Model

  func testFollowedChallengeDecodes() throws {
    let json = """
    {
      "_id": "fc_1",
      "userId": "u_follower",
      "challengeId": "ch_target",
      "createdAt": 1234567890
    }
    """
    let decoded = try JSONDecoder().decode(FollowedChallenge.self, from: Data(json.utf8))
    XCTAssertEqual(decoded._id, "fc_1")
    XCTAssertEqual(decoded.challengeId, "ch_target")
  }

  // MARK: - API URL Construction

  func testAPIBaseURLConstruction() throws {
    let api = TallyAPI(baseURL: URL(string: "https://tally-tracker.app")!)
    XCTAssertEqual(api.baseURL.absoluteString, "https://tally-tracker.app")
  }
}
