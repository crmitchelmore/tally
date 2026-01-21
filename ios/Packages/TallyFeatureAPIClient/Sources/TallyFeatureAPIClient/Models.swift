import Foundation

/// Challenge timeframe types
public enum TimeframeType: String, Codable, Sendable {
    case year
    case month
    case custom
}

/// Count type for challenges
public enum CountType: String, Codable, Sendable {
    case simple
    case sets
    case custom
}

/// Feeling type for entries
public enum Feeling: String, Codable, Sendable {
    case great
    case good
    case okay
    case tough
}

/// Challenge model matching API response
public struct Challenge: Codable, Identifiable, Sendable, Equatable {
    public let id: String
    public let userId: String
    public let name: String
    public let target: Int
    public let timeframeType: TimeframeType
    public let startDate: String
    public let endDate: String
    public let color: String
    public let icon: String
    public let isPublic: Bool
    public let isArchived: Bool
    // Count configuration (optional for backward compatibility)
    public let countType: CountType?
    public let unitLabel: String?
    public let defaultIncrement: Int?
    public let createdAt: String
    public let updatedAt: String
    
    // Convenience computed properties with defaults
    public var resolvedCountType: CountType { countType ?? .simple }
    public var resolvedUnitLabel: String { unitLabel ?? "reps" }
    public var resolvedDefaultIncrement: Int { defaultIncrement ?? 1 }
    
    public init(
        id: String,
        userId: String,
        name: String,
        target: Int,
        timeframeType: TimeframeType,
        startDate: String,
        endDate: String,
        color: String,
        icon: String,
        isPublic: Bool,
        isArchived: Bool,
        countType: CountType? = nil,
        unitLabel: String? = nil,
        defaultIncrement: Int? = nil,
        createdAt: String,
        updatedAt: String
    ) {
        self.id = id
        self.userId = userId
        self.name = name
        self.target = target
        self.timeframeType = timeframeType
        self.startDate = startDate
        self.endDate = endDate
        self.color = color
        self.icon = icon
        self.isPublic = isPublic
        self.isArchived = isArchived
        self.countType = countType
        self.unitLabel = unitLabel
        self.defaultIncrement = defaultIncrement
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

/// Entry model matching API response
public struct Entry: Codable, Identifiable, Sendable, Equatable {
    public let id: String
    public let userId: String
    public let challengeId: String
    public let date: String
    public let count: Int
    public let sets: [Int]?
    public let note: String?
    public let feeling: Feeling?
    public let createdAt: String
    public let updatedAt: String
    
    public init(
        id: String,
        userId: String,
        challengeId: String,
        date: String,
        count: Int,
        sets: [Int]? = nil,
        note: String? = nil,
        feeling: Feeling? = nil,
        createdAt: String,
        updatedAt: String
    ) {
        self.id = id
        self.userId = userId
        self.challengeId = challengeId
        self.date = date
        self.count = count
        self.sets = sets
        self.note = note
        self.feeling = feeling
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

/// Pace status for statistics
public enum PaceStatus: String, Codable, Sendable {
    case ahead
    case onPace = "on-pace"
    case behind
    case none
}

/// Challenge statistics
public struct ChallengeStats: Codable, Sendable, Equatable {
    public let challengeId: String
    public let totalCount: Int
    public let remaining: Int
    public let daysElapsed: Int
    public let daysRemaining: Int
    public let perDayRequired: Double
    public let currentPace: Double
    public let paceStatus: PaceStatus
    public let streakCurrent: Int
    public let streakBest: Int
    public let bestDay: BestDay?
    public let dailyAverage: Double
    
    public struct BestDay: Codable, Sendable, Equatable {
        public let date: String
        public let count: Int
    }
}

/// Dashboard statistics
public struct DashboardStats: Codable, Sendable, Equatable {
    public let totalMarks: Int
    public let today: Int
    public let bestStreak: Int
    public let overallPaceStatus: PaceStatus
}

/// Personal records
public struct PersonalRecords: Codable, Sendable, Equatable {
    public let bestSingleDay: BestDay?
    public let longestStreak: Int
    public let highestDailyAverage: HighestAverage?
    public let mostActiveDays: Int
    public let biggestSingleEntry: BiggestEntry?
    
    public struct BestDay: Codable, Sendable, Equatable {
        public let date: String
        public let count: Int
    }
    
    public struct HighestAverage: Codable, Sendable, Equatable {
        public let challengeId: String
        public let average: Double
    }
    
    public struct BiggestEntry: Codable, Sendable, Equatable {
        public let date: String
        public let count: Int
        public let challengeId: String
    }
}

/// Weekly summary
public struct WeeklySummary: Codable, Sendable, Equatable {
    public let weekStart: String
    public let weekEnd: String
    public let totalMarks: Int
    public let dailyBreakdown: [DayBreakdown]
    public let activeChallenges: Int
    public let paceComparison: String
    
    public struct DayBreakdown: Codable, Sendable, Equatable {
        public let date: String
        public let count: Int
    }
}
