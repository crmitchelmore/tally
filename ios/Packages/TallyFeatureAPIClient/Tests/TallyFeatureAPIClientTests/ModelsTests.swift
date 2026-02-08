import XCTest
@testable import TallyFeatureAPIClient

final class ModelsTests: XCTestCase {
    
    // MARK: - Challenge Tests
    
    func testChallengeDecoding() throws {
        let json = """
        {
            "id": "ch_123",
            "user_id": "user_456",
            "name": "Daily Push-ups",
            "target": 10000,
            "timeframe_type": "year",
            "start_date": "2026-01-01",
            "end_date": "2026-12-31",
            "color": "#FF4747",
            "icon": "tally",
            "is_public": false,
            "is_archived": false,
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-01T00:00:00Z"
        }
        """.data(using: .utf8)!
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        let challenge = try decoder.decode(Challenge.self, from: json)
        
        XCTAssertEqual(challenge.id, "ch_123")
        XCTAssertEqual(challenge.userId, "user_456")
        XCTAssertEqual(challenge.name, "Daily Push-ups")
        XCTAssertEqual(challenge.target, 10000)
        XCTAssertEqual(challenge.timeframeType, .year)
        XCTAssertEqual(challenge.startDate, "2026-01-01")
        XCTAssertEqual(challenge.endDate, "2026-12-31")
        XCTAssertEqual(challenge.color, "#FF4747")
        XCTAssertEqual(challenge.icon, "tally")
        XCTAssertFalse(challenge.isPublic)
        XCTAssertFalse(challenge.isArchived)
    }
    
    func testChallengeEncoding() throws {
        let challenge = Challenge(
            id: "ch_123",
            userId: "user_456",
            name: "Daily Push-ups",
            target: 10000,
            timeframeType: .year,
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            color: "#FF4747",
            icon: "tally",
            isPublic: false,
            isArchived: false,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z"
        )
        
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .convertToSnakeCase
        
        let data = try encoder.encode(challenge)
        let jsonString = String(data: data, encoding: .utf8)!
        
        XCTAssertTrue(jsonString.contains("\"user_id\":\"user_456\""))
        XCTAssertTrue(jsonString.contains("\"timeframe_type\":\"year\""))
        XCTAssertTrue(jsonString.contains("\"is_public\":false"))
    }
    
    // MARK: - Challenge Future/Started State Tests
    
    func testChallengeHasStarted_PastStartDate() {
        // Challenge that started in the past
        let pastDate = Calendar.current.date(byAdding: .day, value: -10, to: Date())!
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let startDateString = formatter.string(from: pastDate)
        
        let challenge = Challenge(
            id: "ch_1",
            userId: "user_1",
            name: "Past Challenge",
            target: 100,
            timeframeType: .month,
            startDate: startDateString,
            endDate: "2026-12-31",
            color: "#FF0000",
            icon: "star",
            isPublic: false,
            isArchived: false,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z"
        )
        
        XCTAssertTrue(challenge.hasStarted)
        XCTAssertFalse(challenge.isFuture)
        XCTAssertNil(challenge.daysUntilStart)
        XCTAssertNil(challenge.startsInText)
    }
    
    func testChallengeHasStarted_TodayStartDate() {
        // Challenge that starts today
        let today = Date()
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let startDateString = formatter.string(from: today)
        
        let challenge = Challenge(
            id: "ch_2",
            userId: "user_1",
            name: "Today Challenge",
            target: 100,
            timeframeType: .month,
            startDate: startDateString,
            endDate: "2026-12-31",
            color: "#00FF00",
            icon: "checkmark",
            isPublic: false,
            isArchived: false,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z"
        )
        
        XCTAssertTrue(challenge.hasStarted)
        XCTAssertFalse(challenge.isFuture)
        XCTAssertNil(challenge.daysUntilStart)
        XCTAssertNil(challenge.startsInText)
    }
    
    func testChallengeIsFuture_FutureStartDate() {
        // Challenge that starts in the future
        let futureDate = Calendar.current.date(byAdding: .day, value: 10, to: Date())!
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let startDateString = formatter.string(from: futureDate)
        
        let challenge = Challenge(
            id: "ch_3",
            userId: "user_1",
            name: "Future Challenge",
            target: 100,
            timeframeType: .month,
            startDate: startDateString,
            endDate: "2026-12-31",
            color: "#0000FF",
            icon: "calendar",
            isPublic: false,
            isArchived: false,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z"
        )
        
        XCTAssertFalse(challenge.hasStarted)
        XCTAssertTrue(challenge.isFuture)
        XCTAssertEqual(challenge.daysUntilStart, 10)
        XCTAssertEqual(challenge.startsInText, "Starts in 10 days")
    }
    
    func testChallengeStartsInText_Tomorrow() {
        // Challenge that starts tomorrow
        let tomorrow = Calendar.current.date(byAdding: .day, value: 1, to: Date())!
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let startDateString = formatter.string(from: tomorrow)
        
        let challenge = Challenge(
            id: "ch_4",
            userId: "user_1",
            name: "Tomorrow Challenge",
            target: 100,
            timeframeType: .month,
            startDate: startDateString,
            endDate: "2026-12-31",
            color: "#FFFF00",
            icon: "sunrise",
            isPublic: false,
            isArchived: false,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z"
        )
        
        XCTAssertFalse(challenge.hasStarted)
        XCTAssertTrue(challenge.isFuture)
        XCTAssertEqual(challenge.daysUntilStart, 1)
        XCTAssertEqual(challenge.startsInText, "Starts tomorrow")
    }
    
    func testChallengeWithInvalidStartDate() {
        // Challenge with an invalid/unparseable start date should default to "started"
        let challenge = Challenge(
            id: "ch_5",
            userId: "user_1",
            name: "Invalid Date Challenge",
            target: 100,
            timeframeType: .month,
            startDate: "not-a-valid-date",
            endDate: "2026-12-31",
            color: "#FF00FF",
            icon: "exclamationmark",
            isPublic: false,
            isArchived: false,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z"
        )
        
        // Should default to hasStarted = true when date can't be parsed
        XCTAssertTrue(challenge.hasStarted)
        XCTAssertFalse(challenge.isFuture)
        XCTAssertNil(challenge.daysUntilStart)
        XCTAssertNil(challenge.startsInText)
    }
    
    // MARK: - Entry Tests
    
    func testEntryDecoding() throws {
        let json = """
        {
            "id": "en_789",
            "user_id": "user_456",
            "challenge_id": "ch_123",
            "date": "2026-01-15",
            "count": 50,
            "note": "Great workout today!",
            "feeling": "great",
            "created_at": "2026-01-15T10:00:00Z",
            "updated_at": "2026-01-15T10:00:00Z"
        }
        """.data(using: .utf8)!
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        let entry = try decoder.decode(Entry.self, from: json)
        
        XCTAssertEqual(entry.id, "en_789")
        XCTAssertEqual(entry.userId, "user_456")
        XCTAssertEqual(entry.challengeId, "ch_123")
        XCTAssertEqual(entry.date, "2026-01-15")
        XCTAssertEqual(entry.count, 50)
        XCTAssertEqual(entry.note, "Great workout today!")
        XCTAssertEqual(entry.feeling, .great)
    }
    
    func testEntryWithOptionalFieldsDecoding() throws {
        let json = """
        {
            "id": "en_789",
            "user_id": "user_456",
            "challenge_id": "ch_123",
            "date": "2026-01-15",
            "count": 25,
            "note": null,
            "feeling": null,
            "created_at": "2026-01-15T10:00:00Z",
            "updated_at": "2026-01-15T10:00:00Z"
        }
        """.data(using: .utf8)!
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        let entry = try decoder.decode(Entry.self, from: json)
        
        XCTAssertEqual(entry.count, 25)
        XCTAssertNil(entry.note)
        XCTAssertNil(entry.feeling)
    }
    
    // MARK: - Stats Tests
    
    func testChallengeStatsDecoding() throws {
        let json = """
        {
            "challenge_id": "ch_123",
            "total_count": 500,
            "remaining": 9500,
            "days_elapsed": 15,
            "days_remaining": 350,
            "per_day_required": 27.14,
            "current_pace": 33.33,
            "pace_status": "ahead",
            "streak_current": 15,
            "streak_best": 15,
            "best_day": {"date": "2026-01-10", "count": 100},
            "daily_average": 33.33
        }
        """.data(using: .utf8)!
        
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        let stats = try decoder.decode(ChallengeStats.self, from: json)
        
        XCTAssertEqual(stats.challengeId, "ch_123")
        XCTAssertEqual(stats.totalCount, 500)
        XCTAssertEqual(stats.remaining, 9500)
        XCTAssertEqual(stats.daysElapsed, 15)
        XCTAssertEqual(stats.daysRemaining, 350)
        XCTAssertEqual(stats.paceStatus, .ahead)
        XCTAssertEqual(stats.streakCurrent, 15)
        XCTAssertEqual(stats.bestDay?.count, 100)
    }
    
    func testPaceStatusDecoding() throws {
        // Test all pace status values
        let values: [(String, PaceStatus)] = [
            ("\"ahead\"", .ahead),
            ("\"on-pace\"", .onPace),
            ("\"behind\"", .behind),
            ("\"none\"", .none)
        ]
        
        let decoder = JSONDecoder()
        
        for (jsonValue, expectedStatus) in values {
            let data = jsonValue.data(using: .utf8)!
            let decoded = try decoder.decode(PaceStatus.self, from: data)
            XCTAssertEqual(decoded, expectedStatus, "Failed for \(jsonValue)")
        }
    }
    
    // MARK: - TimeframeType Tests
    
    func testTimeframeTypeDecoding() throws {
        let values: [(String, TimeframeType)] = [
            ("\"year\"", .year),
            ("\"month\"", .month),
            ("\"custom\"", .custom)
        ]
        
        let decoder = JSONDecoder()
        
        for (jsonValue, expectedType) in values {
            let data = jsonValue.data(using: .utf8)!
            let decoded = try decoder.decode(TimeframeType.self, from: data)
            XCTAssertEqual(decoded, expectedType, "Failed for \(jsonValue)")
        }
    }
    
    // MARK: - Feeling Tests
    
    func testFeelingDecoding() throws {
        let values: [(String, Feeling)] = [
            ("\"great\"", .great),
            ("\"good\"", .good),
            ("\"okay\"", .okay),
            ("\"tough\"", .tough)
        ]
        
        let decoder = JSONDecoder()
        
        for (jsonValue, expectedFeeling) in values {
            let data = jsonValue.data(using: .utf8)!
            let decoded = try decoder.decode(Feeling.self, from: data)
            XCTAssertEqual(decoded, expectedFeeling, "Failed for \(jsonValue)")
        }
    }
}
