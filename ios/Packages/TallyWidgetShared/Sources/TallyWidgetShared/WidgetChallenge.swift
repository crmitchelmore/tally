import Foundation

/// Lightweight challenge model for widget display
/// Stored in App Group shared container for widget access
public struct WidgetChallenge: Codable, Identifiable, Sendable, Equatable {
    public let id: String
    public let name: String
    public let target: Int
    public let currentCount: Int
    public let color: String
    public let icon: String
    public let streakCurrent: Int
    public let streakBest: Int
    public let daysRemaining: Int
    public let perDayRequired: Double
    public let currentPace: Double
    public let paceStatus: WidgetPaceStatus
    public let lastUpdated: Date
    
    public init(
        id: String,
        name: String,
        target: Int,
        currentCount: Int,
        color: String,
        icon: String,
        streakCurrent: Int,
        streakBest: Int,
        daysRemaining: Int,
        perDayRequired: Double,
        currentPace: Double,
        paceStatus: WidgetPaceStatus,
        lastUpdated: Date
    ) {
        self.id = id
        self.name = name
        self.target = target
        self.currentCount = currentCount
        self.color = color
        self.icon = icon
        self.streakCurrent = streakCurrent
        self.streakBest = streakBest
        self.daysRemaining = daysRemaining
        self.perDayRequired = perDayRequired
        self.currentPace = currentPace
        self.paceStatus = paceStatus
        self.lastUpdated = lastUpdated
    }
    
    /// Progress as a value from 0 to 1
    public var progress: Double {
        guard target > 0 else { return 0 }
        return min(1.0, Double(currentCount) / Double(target))
    }
    
    /// Remaining count to reach target
    public var remaining: Int {
        max(0, target - currentCount)
    }
    
    /// Whether the challenge is complete
    public var isComplete: Bool {
        currentCount >= target
    }
}

/// Pace status for widget display
public enum WidgetPaceStatus: String, Codable, Sendable {
    case ahead
    case onPace
    case behind
    case none
    
    public var displayText: String {
        switch self {
        case .ahead: return "Ahead"
        case .onPace: return "On pace"
        case .behind: return "Behind"
        case .none: return ""
        }
    }
}
