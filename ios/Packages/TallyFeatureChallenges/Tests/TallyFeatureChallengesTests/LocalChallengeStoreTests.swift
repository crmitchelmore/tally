import XCTest
@testable import TallyFeatureChallenges
import TallyFeatureAPIClient

final class LocalChallengeStoreTests: XCTestCase {
    var store: LocalChallengeStore!
    var testDefaults: UserDefaults!
    var suiteName: String!
    
    override func setUp() {
        super.setUp()
        suiteName = "com.tally.tests.\(UUID().uuidString)"
        testDefaults = UserDefaults(suiteName: suiteName)!
        store = LocalChallengeStore(defaults: testDefaults)
    }
    
    override func tearDown() {
        UserDefaults.standard.removePersistentDomain(forName: suiteName)
        store = nil
        testDefaults = nil
        suiteName = nil
        super.tearDown()
    }
    
    func testSaveAndLoadChallenges() {
        let challenge = makeChallenge(id: "1", name: "Test")
        
        store.saveChallenges([challenge])
        let loaded = store.loadChallenges()
        
        XCTAssertEqual(loaded.count, 1)
        XCTAssertEqual(loaded.first?.id, "1")
        XCTAssertEqual(loaded.first?.name, "Test")
    }
    
    func testUpsertChallenge() {
        let challenge1 = makeChallenge(id: "1", name: "First")
        store.upsertChallenge(challenge1)
        
        XCTAssertEqual(store.loadChallenges().count, 1)
        
        // Update
        let updated = makeChallenge(id: "1", name: "Updated")
        store.upsertChallenge(updated)
        
        let loaded = store.loadChallenges()
        XCTAssertEqual(loaded.count, 1)
        XCTAssertEqual(loaded.first?.name, "Updated")
        
        // Add new
        let challenge2 = makeChallenge(id: "2", name: "Second")
        store.upsertChallenge(challenge2)
        
        XCTAssertEqual(store.loadChallenges().count, 2)
    }
    
    func testRemoveChallenge() {
        store.saveChallenges([
            makeChallenge(id: "1", name: "First"),
            makeChallenge(id: "2", name: "Second")
        ])
        
        store.removeChallenge(id: "1")
        
        let loaded = store.loadChallenges()
        XCTAssertEqual(loaded.count, 1)
        XCTAssertEqual(loaded.first?.id, "2")
    }
    
    func testGetChallenge() {
        store.saveChallenges([
            makeChallenge(id: "1", name: "First"),
            makeChallenge(id: "2", name: "Second")
        ])
        
        let found = store.getChallenge(id: "1")
        XCTAssertNotNil(found)
        XCTAssertEqual(found?.name, "First")
        
        let notFound = store.getChallenge(id: "999")
        XCTAssertNil(notFound)
    }
    
    func testPendingChanges() {
        store.addPendingChange(.create(id: "1"))
        store.addPendingChange(.update(id: "2"))
        
        let pending = store.loadPendingChanges()
        XCTAssertEqual(pending.count, 2)
        
        // Dedupe: same challenge ID replaces
        store.addPendingChange(.delete(id: "1"))
        let updated = store.loadPendingChanges()
        XCTAssertEqual(updated.count, 2)
        
        if case .delete(let id) = updated.first(where: { $0.challengeId == "1" }) {
            XCTAssertEqual(id, "1")
        } else {
            XCTFail("Expected delete change")
        }
    }
    
    func testRemovePendingChange() {
        store.addPendingChange(.create(id: "1"))
        store.addPendingChange(.update(id: "2"))
        
        store.removePendingChange(for: "1")
        
        let pending = store.loadPendingChanges()
        XCTAssertEqual(pending.count, 1)
        XCTAssertEqual(pending.first?.challengeId, "2")
    }
    
    func testClearAll() {
        store.saveChallenges([makeChallenge(id: "1", name: "Test")])
        store.addPendingChange(.create(id: "1"))
        
        store.clearAll()
        
        XCTAssertTrue(store.loadChallenges().isEmpty)
        XCTAssertTrue(store.loadPendingChanges().isEmpty)
    }
    
    func testMergeWithServer() {
        // Local challenge with pending change
        store.upsertChallenge(makeChallenge(id: "1", name: "Local Version"))
        store.addPendingChange(.update(id: "1"))
        
        // Local-only challenge (created offline)
        store.upsertChallenge(makeChallenge(id: "local-only", name: "Offline Created"))
        store.addPendingChange(.create(id: "local-only"))
        
        // Server challenges
        let serverChallenges = [
            makeChallenge(id: "1", name: "Server Version"),
            makeChallenge(id: "2", name: "Server Only")
        ]
        
        store.mergeWithServer(serverChallenges)
        
        let merged = store.loadChallenges()
        
        // Should have 3 challenges
        XCTAssertEqual(merged.count, 3)
        
        // Pending local change should be preserved
        let challenge1 = merged.first { $0.id == "1" }
        XCTAssertEqual(challenge1?.name, "Local Version")
        
        // Server-only should be added
        let challenge2 = merged.first { $0.id == "2" }
        XCTAssertEqual(challenge2?.name, "Server Only")
        
        // Local-only should be preserved
        let localOnly = merged.first { $0.id == "local-only" }
        XCTAssertEqual(localOnly?.name, "Offline Created")
    }
    
    // MARK: - Helpers
    
    private func makeChallenge(id: String, name: String) -> Challenge {
        Challenge(
            id: id,
            userId: "user1",
            name: name,
            target: 100,
            timeframeType: .year,
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            color: "#4B5563",
            icon: "checkmark",
            isPublic: false,
            isArchived: false,
            createdAt: "2026-01-01T00:00:00Z",
            updatedAt: "2026-01-01T00:00:00Z"
        )
    }
}
