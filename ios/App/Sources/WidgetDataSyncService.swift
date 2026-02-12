import Foundation
import WidgetKit
import TallyWidgetShared
import TallyFeatureAPIClient

/// Service to sync challenge data to widgets via App Group shared container
/// Called by the main app when challenges or entries are updated
@MainActor
public final class WidgetDataSyncService: @unchecked Sendable {
    
    public static let shared = WidgetDataSyncService()
    
    private let dataStore = WidgetDataStore.shared
    
    private init() {}
    
    // MARK: - Public API
    
    /// Update widget data from current challenges and stats
    /// Call this whenever challenges, entries, or stats are modified
    public func syncWidgetData(
        challenges: [Challenge],
        stats: [String: ChallengeStats]
    ) {
        let widgetChallenges = challenges
            .filter { !$0.isArchived }
            .compactMap { challenge -> WidgetChallenge? in
                guard let stat = stats[challenge.id] else { return nil }
                return mapToWidgetChallenge(challenge: challenge, stats: stat)
            }
        
        dataStore.saveChallenges(widgetChallenges)
        
        // Request widget timeline refresh
        WidgetCenter.shared.reloadAllTimelines()
    }
    
    /// Clear widget data (called on logout)
    public func clearWidgetData() {
        dataStore.clearAll()
        WidgetCenter.shared.reloadAllTimelines()
    }
    
    // MARK: - Private
    
    /// Map Challenge and ChallengeStats to lightweight WidgetChallenge
    private func mapToWidgetChallenge(challenge: Challenge, stats: ChallengeStats) -> WidgetChallenge {
        WidgetChallenge(
            id: challenge.id,
            name: challenge.name,
            target: challenge.target,
            currentCount: stats.totalCount,
            color: challenge.color,
            icon: challenge.icon,
            streakCurrent: stats.streakCurrent,
            streakBest: stats.streakBest,
            daysRemaining: stats.daysRemaining,
            perDayRequired: stats.perDayRequired,
            currentPace: stats.currentPace,
            paceStatus: mapPaceStatus(stats.paceStatus),
            lastUpdated: Date()
        )
    }
    
    /// Map API pace status to widget pace status
    private func mapPaceStatus(_ status: PaceStatus) -> WidgetPaceStatus {
        switch status {
        case .ahead: return .ahead
        case .onPace: return .onPace
        case .behind: return .behind
        case .none: return .none
        }
    }
}
