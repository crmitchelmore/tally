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
    
    // MARK: - Date Parsing (cached formatter for performance)
    
    private static let isoDateFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        return formatter
    }()
    
    /// Parsed start date
    private var parsedStartDate: Date? {
        Self.isoDateFormatter.date(from: startDate)
    }
    
    /// Whether the challenge has started (start date is today or in the past)
    public var hasStarted: Bool {
        guard let start = parsedStartDate else { return true }
        let today = Calendar.current.startOfDay(for: Date())
        let startDay = Calendar.current.startOfDay(for: start)
        return startDay <= today
    }
    
    /// Whether the challenge is in the future (hasn't started yet)
    public var isFuture: Bool { !hasStarted }
    
    /// Number of days until the challenge starts (nil if already started)
    public var daysUntilStart: Int? {
        guard let start = parsedStartDate else { return nil }
        let today = Calendar.current.startOfDay(for: Date())
        let startDay = Calendar.current.startOfDay(for: start)
        guard startDay > today else { return nil }
        return Calendar.current.dateComponents([.day], from: today, to: startDay).day
    }
    
    /// Human-readable string for when the challenge starts (e.g., "Starts tomorrow", "Starts in 5 days")
    public var startsInText: String? {
        guard let days = daysUntilStart else { return nil }
        if days == 1 {
            return "Starts tomorrow"
        } else {
            return "Starts in \(days) days"
        }
    }
    
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
        
        public init(date: String, count: Int) {
            self.date = date
            self.count = count
        }
    }
    
    public init(
        challengeId: String,
        totalCount: Int,
        remaining: Int,
        daysElapsed: Int,
        daysRemaining: Int,
        perDayRequired: Double,
        currentPace: Double,
        paceStatus: PaceStatus,
        streakCurrent: Int,
        streakBest: Int,
        bestDay: BestDay?,
        dailyAverage: Double
    ) {
        self.challengeId = challengeId
        self.totalCount = totalCount
        self.remaining = remaining
        self.daysElapsed = daysElapsed
        self.daysRemaining = daysRemaining
        self.perDayRequired = perDayRequired
        self.currentPace = currentPace
        self.paceStatus = paceStatus
        self.streakCurrent = streakCurrent
        self.streakBest = streakBest
        self.bestDay = bestDay
        self.dailyAverage = dailyAverage
    }
}

/// Dashboard statistics
public struct DashboardStats: Codable, Sendable, Equatable {
    public let totalMarks: Int
    public let today: Int
    public let bestStreak: Int
    public let overallPaceStatus: PaceStatus
    // Sets-specific stats
    public let bestSet: BestSet?
    public let avgSetValue: Double?
    
    public struct BestSet: Codable, Sendable, Equatable {
        public let value: Int
        public let date: String
        public let challengeId: String
        
        public init(value: Int, date: String, challengeId: String) {
            self.value = value
            self.date = date
            self.challengeId = challengeId
        }
    }
    
    public init(
        totalMarks: Int,
        today: Int,
        bestStreak: Int,
        overallPaceStatus: PaceStatus,
        bestSet: BestSet? = nil,
        avgSetValue: Double? = nil
    ) {
        self.totalMarks = totalMarks
        self.today = today
        self.bestStreak = bestStreak
        self.overallPaceStatus = overallPaceStatus
        self.bestSet = bestSet
        self.avgSetValue = avgSetValue
    }
}

/// Personal records
public struct PersonalRecords: Codable, Sendable, Equatable {
    public let bestSingleDay: BestDay?
    public let longestStreak: Int
    public let highestDailyAverage: HighestAverage?
    public let mostActiveDays: Int
    public let biggestSingleEntry: BiggestEntry?
    // Sets-specific records
    public let bestSet: BestSet?
    public let avgSetValue: Double?
    
    public struct BestDay: Codable, Sendable, Equatable {
        public let date: String
        public let count: Int
        
        public init(date: String, count: Int) {
            self.date = date
            self.count = count
        }
    }
    
    public struct HighestAverage: Codable, Sendable, Equatable {
        public let challengeId: String
        public let average: Double
        
        public init(challengeId: String, average: Double) {
            self.challengeId = challengeId
            self.average = average
        }
    }
    
    public struct BiggestEntry: Codable, Sendable, Equatable {
        public let date: String
        public let count: Int
        public let challengeId: String
        
        public init(date: String, count: Int, challengeId: String) {
            self.date = date
            self.count = count
            self.challengeId = challengeId
        }
    }
    
    public struct BestSet: Codable, Sendable, Equatable {
        public let value: Int
        public let date: String
        public let challengeId: String
        
        public init(value: Int, date: String, challengeId: String) {
            self.value = value
            self.date = date
            self.challengeId = challengeId
        }
    }
    
    public init(
        bestSingleDay: BestDay? = nil,
        longestStreak: Int,
        highestDailyAverage: HighestAverage? = nil,
        mostActiveDays: Int,
        biggestSingleEntry: BiggestEntry? = nil,
        bestSet: BestSet? = nil,
        avgSetValue: Double? = nil
    ) {
        self.bestSingleDay = bestSingleDay
        self.longestStreak = longestStreak
        self.highestDailyAverage = highestDailyAverage
        self.mostActiveDays = mostActiveDays
        self.biggestSingleEntry = biggestSingleEntry
        self.bestSet = bestSet
        self.avgSetValue = avgSetValue
    }
}

/// Dashboard panel identifiers
public enum DashboardPanel: String, Codable, CaseIterable, Identifiable, Sendable {
    case activeChallenges
    case highlights
    case personalRecords
    case progressGraph
    case burnUpChart
    
    public var id: String { rawValue }
    
    public var title: String {
        switch self {
        case .activeChallenges: return "Active Challenges"
        case .highlights: return "Highlights"
        case .personalRecords: return "Personal Records"
        case .progressGraph: return "Progress Graph"
        case .burnUpChart: return "Goal Progress"
        }
    }
    
    public static let defaultOrder: [DashboardPanel] = [
        .activeChallenges,
        .highlights,
        .personalRecords,
        .progressGraph,
        .burnUpChart
    ]
}

/// Dashboard panel configuration
public struct DashboardConfig: Codable, Sendable, Equatable {
    public var visiblePanels: [DashboardPanel]
    public var hiddenPanels: [DashboardPanel]
    
    public init(visiblePanels: [DashboardPanel] = DashboardPanel.defaultOrder, hiddenPanels: [DashboardPanel] = []) {
        self.visiblePanels = visiblePanels
        self.hiddenPanels = hiddenPanels
    }
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        // Try internal format first (visiblePanels/hiddenPanels - used in local storage)
        let visiblePanelsValue = try? container.decodeIfPresent([DashboardPanel].self, forKey: .visiblePanels)
        let hiddenPanelsValue = try? container.decodeIfPresent([DashboardPanel].self, forKey: .hiddenPanels)
        if visiblePanelsValue != nil || hiddenPanelsValue != nil {
            self.visiblePanels = visiblePanelsValue ?? DashboardPanel.defaultOrder
            self.hiddenPanels = hiddenPanelsValue ?? []
            return
        }
        
        // Try API format (visible/hidden - returned from server)
        let visibleValue = try? container.decodeIfPresent([DashboardPanel].self, forKey: .visible)
        let hiddenValue = try? container.decodeIfPresent([DashboardPanel].self, forKey: .hidden)
        if visibleValue != nil || hiddenValue != nil {
            self.visiblePanels = visibleValue ?? DashboardPanel.defaultOrder
            self.hiddenPanels = hiddenValue ?? []
            return
        }
        
        // Fall back to legacy format (panels boolean object with optional order)
        if let oldPanels = try? container.decodeIfPresent(OldPanels.self, forKey: .panels) {
            let order = (try? container.decodeIfPresent([DashboardPanel].self, forKey: .order)) ?? DashboardPanel.defaultOrder
            var visible: [DashboardPanel] = []
            var hidden: [DashboardPanel] = []
            
            for panel in order {
                let isVisible: Bool
                switch panel {
                case .activeChallenges: isVisible = true // Default visible for new panel
                case .highlights: isVisible = oldPanels.highlights
                case .personalRecords: isVisible = oldPanels.personalRecords
                case .progressGraph: isVisible = oldPanels.progressGraph
                case .burnUpChart: isVisible = oldPanels.burnUpChart
                }
                
                if isVisible {
                    visible.append(panel)
                } else {
                    hidden.append(panel)
                }
            }
            
            // Ensure activeChallenges is included for old configs that didn't have it
            if !visible.contains(.activeChallenges) && !hidden.contains(.activeChallenges) {
                visible.insert(.activeChallenges, at: 0)
            }
            
            self.visiblePanels = visible
            self.hiddenPanels = hidden
            return
        }
        
        // Default fallback
        self.visiblePanels = DashboardPanel.defaultOrder
        self.hiddenPanels = []
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(visiblePanels, forKey: .visiblePanels)
        try container.encode(hiddenPanels, forKey: .hiddenPanels)
    }
    
    private enum CodingKeys: String, CodingKey {
        case visiblePanels  // Internal/local storage format
        case hiddenPanels   // Internal/local storage format
        case visible        // API response format
        case hidden         // API response format
        case panels         // Legacy format
        case order          // Legacy format
    }
    
    private struct OldPanels: Codable {
        var highlights: Bool
        var personalRecords: Bool
        var progressGraph: Bool
        var burnUpChart: Bool
        var setsStats: Bool
    }
    
    public static let `default` = DashboardConfig()
}

/// Weekly summary
// MARK: - Public Challenge (Community)

/// Public challenge with aggregated metadata for community view
public struct PublicChallenge: Codable, Identifiable, Sendable, Equatable {
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
    public let createdAt: String
    public let updatedAt: String
    
    // Aggregated metadata
    public let totalReps: Int
    public let progress: Double
    public let followerCount: Int
    public let isFollowing: Bool
    public let owner: Owner
    
    public struct Owner: Codable, Sendable, Equatable {
        public let id: String
        public let name: String
    }
}

// MARK: - Export/Import Data

/// Export data response for user data export
public struct ExportDataResponse: Codable, Sendable, Equatable {
    public let version: String
    public let exportedAt: String
    public let challenges: [Challenge]
    public let entries: [Entry]
    
    public init(version: String, exportedAt: String, challenges: [Challenge], entries: [Entry]) {
        self.version = version
        self.exportedAt = exportedAt
        self.challenges = challenges
        self.entries = entries
    }
}
