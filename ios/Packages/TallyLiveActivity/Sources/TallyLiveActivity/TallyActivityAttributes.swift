import Foundation
import ActivityKit

/// Attributes for Tally Live Activity tracking session
public struct TallyActivityAttributes: ActivityAttributes {
    
    /// Dynamic content state that updates during the activity
    public struct ContentState: Codable, Hashable {
        /// Current count for this session
        public var sessionCount: Int
        
        /// Total count including previous entries
        public var totalCount: Int
        
        /// Target for the challenge
        public var target: Int
        
        /// Current streak in days
        public var streak: Int
        
        /// Last update timestamp
        public var lastUpdated: Date
        
        public init(
            sessionCount: Int,
            totalCount: Int,
            target: Int,
            streak: Int,
            lastUpdated: Date = Date()
        ) {
            self.sessionCount = sessionCount
            self.totalCount = totalCount
            self.target = target
            self.streak = streak
            self.lastUpdated = lastUpdated
        }
        
        /// Progress as a value from 0 to 1
        public var progress: Double {
            guard target > 0 else { return 0 }
            return min(1.0, Double(totalCount) / Double(target))
        }
        
        /// Remaining count to reach target
        public var remaining: Int {
            max(0, target - totalCount)
        }
    }
    
    /// Challenge ID
    public var challengeId: String
    
    /// Challenge name
    public var challengeName: String
    
    /// Challenge color (hex string)
    public var challengeColor: String
    
    /// Unit label for the challenge (e.g., "push-ups", "pages")
    public var unitLabel: String?
    
    public init(
        challengeId: String,
        challengeName: String,
        challengeColor: String,
        unitLabel: String? = nil
    ) {
        self.challengeId = challengeId
        self.challengeName = challengeName
        self.challengeColor = challengeColor
        self.unitLabel = unitLabel
    }
}
