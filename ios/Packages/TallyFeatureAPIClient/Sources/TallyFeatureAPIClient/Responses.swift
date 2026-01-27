import Foundation

/// API response wrappers matching server format

/// Wrapper for challenge with embedded stats from list endpoint
public struct ChallengeWithStats: Codable, Sendable {
    public let challenge: Challenge
    public let stats: ChallengeStats
}

public struct ChallengesResponse: Codable, Sendable {
    public let challenges: [ChallengeWithStats]
}

public struct ChallengeResponse: Codable, Sendable {
    public let challenge: Challenge
}

public struct EntriesResponse: Codable, Sendable {
    public let entries: [Entry]
}

public struct EntryResponse: Codable, Sendable {
    public let entry: Entry
}

public struct StatsResponse: Codable, Sendable {
    public let stats: ChallengeStats
}

public struct DashboardStatsResponse: Codable, Sendable {
    public let stats: DashboardStats
}

public struct PersonalRecordsResponse: Codable, Sendable {
    public let records: PersonalRecords
}

public struct WeeklySummaryResponse: Codable, Sendable {
    public let summary: WeeklySummary
}

public struct DeleteResponse: Codable, Sendable {
    public let success: Bool
}

/// API error response
public struct APIErrorResponse: Codable, Sendable {
    public let error: String
    public let code: String?
    public let details: [String: String]?
}
