import Foundation

/// Response wrapper for a single challenge
public struct ChallengeResponse: Codable, Sendable {
    public let challenge: Challenge
}

/// Response wrapper for challenges list
public struct ChallengesResponse: Codable, Sendable {
    public let challenges: [Challenge]
}

/// Response wrapper for challenges with stats (from /api/v1/challenges)
public struct ChallengeWithStatsResponse: Codable, Sendable {
    public let challenges: [ChallengeWithStats]
    
    public struct ChallengeWithStats: Codable, Sendable {
        public let challenge: Challenge
        public let stats: ChallengeStats
    }
}

/// Response wrapper for a single entry
public struct EntryResponse: Codable, Sendable {
    public let entry: Entry
}

/// Response wrapper for entries list
public struct EntriesResponse: Codable, Sendable {
    public let entries: [Entry]
}

/// Response for delete operations
public struct DeleteResponse: Codable, Sendable {
    public let id: String
    public let deleted: Bool
}

/// Response for challenge stats
public struct StatsResponse: Codable, Sendable {
    public let stats: ChallengeStats
}

/// Response for dashboard stats
public struct DashboardStatsResponse: Codable, Sendable {
    public let stats: DashboardStats
}

/// Combined dashboard response
public struct DashboardResponse: Codable, Sendable {
    public let dashboard: DashboardStats
    public let records: PersonalRecords
}

/// Response for personal records
public struct PersonalRecordsResponse: Codable, Sendable {
    public let records: PersonalRecords
}

/// Response for weekly summary
public struct WeeklySummaryResponse: Codable, Sendable {
    public let summary: WeeklySummary
}

/// API error response structure
public struct APIErrorResponse: Codable, Sendable {
    public let error: String
    public let code: String?
    public let details: [String: String]?
}

/// Public challenge model for community view
public struct PublicChallenge: Codable, Sendable, Identifiable {
    public let id: String
    public let name: String
    public let target: Int
    public let icon: String
    public let color: String
    public let totalReps: Int
    public let progress: Double
    public let followerCount: Int
    public let isFollowing: Bool
    public let isOwner: Bool
    public let owner: Owner
    
    public struct Owner: Codable, Sendable {
        public let id: String
        public let name: String
    }
}

/// Response for public challenges list
public struct PublicChallengesResponse: Codable, Sendable {
    public let challenges: [PublicChallenge]
}

/// Response for followed challenges
public struct FollowedChallengesResponse: Codable, Sendable {
    public let challenges: [PublicChallenge]
}

/// Response for follow operation
public struct FollowResponse: Codable, Sendable {
    public let follow: Follow
    
    public struct Follow: Codable, Sendable {
        public let id: String
        public let userId: String
        public let challengeId: String
        public let createdAt: String
    }
}

/// Response for unfollow operation
public struct UnfollowResponse: Codable, Sendable {
    public let unfollowed: Bool
}

/// Request to follow/unfollow a challenge
public struct FollowRequest: Codable, Sendable {
    public let challengeId: String
    
    public init(challengeId: String) {
        self.challengeId = challengeId
    }
}

/// Export data response
public struct ExportDataResponse: Codable, Sendable {
    public let version: String
    public let exportedAt: String
    public let challenges: [Challenge]
    public let entries: [Entry]
    public let dashboardConfig: DashboardConfig?
}

/// Import data request
public struct ImportDataRequest: Codable, Sendable {
    public let version: String
    public let challenges: [Challenge]
    public let entries: [Entry]
    public let dashboardConfig: DashboardConfig?
    
    public init(
        version: String = "1.0",
        challenges: [Challenge],
        entries: [Entry],
        dashboardConfig: DashboardConfig? = nil
    ) {
        self.version = version
        self.challenges = challenges
        self.entries = entries
        self.dashboardConfig = dashboardConfig
    }
}

/// Import result
public struct ImportDataResponse: Codable, Sendable {
    public let imported: ImportedCounts
    
    public struct ImportedCounts: Codable, Sendable {
        public let challenges: Int
        public let entries: Int
    }
}
