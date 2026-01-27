import BackgroundTasks
import Foundation
import TallyFeatureAPIClient
import TallyFeatureChallenges

/// Manages iOS Background App Refresh to keep challenge data fresh
/// Data is refreshed periodically in the background so the app launches instantly with recent data
public final class BackgroundRefreshManager: @unchecked Sendable {
    public static let shared = BackgroundRefreshManager()
    
    /// Task identifier - must match Info.plist BGTaskSchedulerPermittedIdentifiers
    public static let refreshTaskIdentifier = "com.tally.app.refresh"
    
    /// Minimum interval between background refreshes (15 minutes)
    private let minimumRefreshInterval: TimeInterval = 15 * 60
    
    private let localStore = LocalChallengeStore.shared
    private let apiClient = APIClient.shared
    
    private init() {}
    
    // MARK: - Registration
    
    /// Call from app launch to register background tasks
    public func registerBackgroundTasks() {
        BGTaskScheduler.shared.register(
            forTaskWithIdentifier: Self.refreshTaskIdentifier,
            using: nil
        ) { [weak self] task in
            guard let task = task as? BGAppRefreshTask else { return }
            self?.handleBackgroundRefresh(task: task)
        }
    }
    
    /// Schedule the next background refresh
    public func scheduleBackgroundRefresh() {
        let request = BGAppRefreshTaskRequest(identifier: Self.refreshTaskIdentifier)
        request.earliestBeginDate = Date(timeIntervalSinceNow: minimumRefreshInterval)
        
        do {
            try BGTaskScheduler.shared.submit(request)
        } catch {
            // Background refresh not available (e.g., simulator, user disabled)
        }
    }
    
    // MARK: - Background Task Handler
    
    private func handleBackgroundRefresh(task: BGAppRefreshTask) {
        // Schedule the next refresh immediately
        scheduleBackgroundRefresh()
        
        // Create a task to perform the refresh
        let refreshOperation = Task {
            await performDataRefresh()
        }
        
        // Handle task expiration
        task.expirationHandler = {
            refreshOperation.cancel()
        }
        
        // Mark task complete when done
        Task {
            _ = await refreshOperation.result
            task.setTaskCompleted(success: !refreshOperation.isCancelled)
        }
    }
    
    /// Perform the actual data refresh
    @MainActor
    private func performDataRefresh() async {
        do {
            // Fetch fresh challenges from server
            let serverChallenges = try await apiClient.listChallenges(includeArchived: true)
            
            // Merge with local cache (preserves pending changes)
            localStore.mergeWithServer(serverChallenges)
            
        } catch {
            // Refresh failed - cached data remains, will retry next background refresh
        }
    }
}
