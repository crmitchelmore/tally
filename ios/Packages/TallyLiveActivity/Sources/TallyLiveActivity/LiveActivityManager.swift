import Foundation
import ActivityKit

/// Manager for Tally Live Activities
/// Handles starting, updating, and ending tracking sessions
@MainActor
public final class LiveActivityManager: Sendable {
    
    public static let shared = LiveActivityManager()
    
    private init() {}
    
    /// Currently active live activity
    @MainActor
    private var currentActivity: Activity<TallyActivityAttributes>?
    
    /// Check if Live Activities are supported and enabled
    public var areActivitiesEnabled: Bool {
        ActivityAuthorizationInfo().areActivitiesEnabled
    }
    
    // MARK: - Public API
    
    /// Start a new tracking session for a challenge
    /// - Parameters:
    ///   - challengeId: ID of the challenge
    ///   - challengeName: Display name of the challenge
    ///   - challengeColor: Hex color string for the challenge
    ///   - unitLabel: Optional unit label (e.g., "push-ups")
    ///   - initialCount: Starting count for this session (usually 0)
    ///   - totalCount: Total count including previous entries
    ///   - target: Challenge target
    ///   - streak: Current streak in days
    /// - Returns: True if activity was started successfully
    @discardableResult
    public func startTrackingSession(
        challengeId: String,
        challengeName: String,
        challengeColor: String,
        unitLabel: String? = nil,
        initialCount: Int = 0,
        totalCount: Int,
        target: Int,
        streak: Int
    ) async -> Bool {
        // End any existing activity first
        await endCurrentSession()
        
        guard areActivitiesEnabled else {
            print("[LiveActivityManager] Activities are not enabled")
            return false
        }
        
        let attributes = TallyActivityAttributes(
            challengeId: challengeId,
            challengeName: challengeName,
            challengeColor: challengeColor,
            unitLabel: unitLabel
        )
        
        let initialState = TallyActivityAttributes.ContentState(
            sessionCount: initialCount,
            totalCount: totalCount,
            target: target,
            streak: streak
        )
        
        let content = ActivityContent(
            state: initialState,
            staleDate: Calendar.current.date(byAdding: .hour, value: 4, to: Date())
        )
        
        do {
            let activity = try Activity.request(
                attributes: attributes,
                content: content,
                pushType: nil // No push updates for now
            )
            currentActivity = activity
            print("[LiveActivityManager] Started activity: \(activity.id)")
            return true
        } catch {
            print("[LiveActivityManager] Failed to start activity: \(error)")
            return false
        }
    }
    
    /// Update the current tracking session with new counts
    /// - Parameters:
    ///   - sessionCount: New session count
    ///   - totalCount: New total count
    ///   - target: Target (may have changed)
    ///   - streak: Current streak
    public func updateSession(
        sessionCount: Int,
        totalCount: Int,
        target: Int,
        streak: Int
    ) async {
        guard let activity = currentActivity else {
            print("[LiveActivityManager] No active session to update")
            return
        }
        
        let updatedState = TallyActivityAttributes.ContentState(
            sessionCount: sessionCount,
            totalCount: totalCount,
            target: target,
            streak: streak
        )
        
        let content = ActivityContent(
            state: updatedState,
            staleDate: Calendar.current.date(byAdding: .hour, value: 4, to: Date())
        )
        
        await activity.update(content)
        print("[LiveActivityManager] Updated activity with session count: \(sessionCount)")
    }
    
    /// End the current tracking session
    /// - Parameter finalState: Optional final state to display
    public func endCurrentSession(showFinalState: Bool = false) async {
        guard let activity = currentActivity else {
            return
        }
        
        if showFinalState {
            // Keep the activity visible briefly with final state
            await activity.end(
                activity.content,
                dismissalPolicy: .after(Date().addingTimeInterval(60))
            )
        } else {
            await activity.end(activity.content, dismissalPolicy: .immediate)
        }
        
        currentActivity = nil
        print("[LiveActivityManager] Ended activity")
    }
    
    /// Check if there's an active tracking session
    public var hasActiveSession: Bool {
        currentActivity != nil
    }
    
    /// Get the challenge ID of the current session
    public var currentChallengeId: String? {
        currentActivity?.attributes.challengeId
    }
}
