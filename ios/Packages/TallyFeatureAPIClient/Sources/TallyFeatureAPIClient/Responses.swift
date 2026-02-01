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

public struct StatsSummaryResponse: Codable, Sendable {
    public let dashboard: DashboardStats
    public let records: PersonalRecords
}

/// User preferences response (dashboard config, etc.)
public struct UserPreferencesResponse: Codable, Sendable {
    public let dashboardConfig: DashboardConfig

    private enum CodingKeys: String, CodingKey {
        case dashboardConfig = "dashboardConfig"
    }
}

public struct DeleteResponse: Codable, Sendable {
    public let success: Bool
}

/// Response for public challenges list
public struct PublicChallengesResponse: Codable, Sendable {
    public let challenges: [PublicChallenge]
}

/// Empty response for operations that don't return data
public struct EmptyResponse: Codable, Sendable {
    // Server may return {} or {"success": true}
    public let success: Bool?
    
    public init(from decoder: Decoder) throws {
        let container = try? decoder.container(keyedBy: CodingKeys.self)
        self.success = try? container?.decodeIfPresent(Bool.self, forKey: .success)
    }
    
    private enum CodingKeys: String, CodingKey {
        case success
    }
}

/// Response for import data operation
public struct ImportDataResponse: Codable, Sendable {
    public let imported: ImportCounts
    
    public struct ImportCounts: Codable, Sendable {
        public let challenges: Int
        public let entries: Int
    }
}

/// API error response
public struct APIErrorResponse: Codable, Sendable {
    public let error: String
    public let code: String?
    public let details: [String: String]?
}
