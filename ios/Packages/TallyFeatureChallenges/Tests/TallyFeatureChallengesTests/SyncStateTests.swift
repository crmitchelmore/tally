import XCTest
@testable import TallyFeatureChallenges

final class SyncStateTests: XCTestCase {
    
    func testSyncStateDisplayText() {
        XCTAssertEqual(SyncState.synced.displayText, "Synced")
        XCTAssertEqual(SyncState.pending(count: 3).displayText, "3 pending")
        XCTAssertEqual(SyncState.syncing.displayText, "Syncing…")
        XCTAssertEqual(SyncState.failed(error: "Network error").displayText, "Sync failed: Network error")
        XCTAssertEqual(SyncState.offline.displayText, "Offline")
    }
    
    func testSyncStateIsOffline() {
        XCTAssertFalse(SyncState.synced.isOffline)
        XCTAssertFalse(SyncState.pending(count: 1).isOffline)
        XCTAssertFalse(SyncState.syncing.isOffline)
        XCTAssertFalse(SyncState.failed(error: "error").isOffline)
        XCTAssertTrue(SyncState.offline.isOffline)
    }
    
    func testSyncStateHasPendingChanges() {
        XCTAssertFalse(SyncState.synced.hasPendingChanges)
        XCTAssertTrue(SyncState.pending(count: 1).hasPendingChanges)
        XCTAssertFalse(SyncState.syncing.hasPendingChanges)
        XCTAssertFalse(SyncState.failed(error: "error").hasPendingChanges)
        XCTAssertFalse(SyncState.offline.hasPendingChanges)
    }
    
    func testPendingChangeChallengeId() {
        XCTAssertEqual(PendingChange.create(id: "123").challengeId, "123")
        XCTAssertEqual(PendingChange.update(id: "456").challengeId, "456")
        XCTAssertEqual(PendingChange.delete(id: "789").challengeId, "789")
        XCTAssertEqual(PendingChange.archive(id: "abc").challengeId, "abc")
    }
}
