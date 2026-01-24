import XCTest
@testable import TallyFeatureTipJar

final class TipStoreTests: XCTestCase {
    
    @MainActor
    func testInitialState() {
        let store = TipStore.shared
        XCTAssertEqual(store.purchaseState, .ready)
        XCTAssertTrue(store.products.isEmpty)
    }
    
    @MainActor
    func testResetState() {
        let store = TipStore.shared
        store.resetState()
        XCTAssertEqual(store.purchaseState, .ready)
    }
}
