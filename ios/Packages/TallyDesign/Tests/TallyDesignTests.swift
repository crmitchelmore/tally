import XCTest
@testable import TallyDesign

final class TallyDesignTests: XCTestCase {
    func testColorTokensExist() {
        // Verify color tokens compile and are accessible
        XCTAssertNotNil(Color.tallyPaper)
        XCTAssertNotNil(Color.tallyInk)
        XCTAssertNotNil(Color.tallyAccent)
    }
    
    func testSpacingScale() {
        XCTAssertEqual(TallySpacing.xs, 4)
        XCTAssertEqual(TallySpacing.sm, 8)
        XCTAssertEqual(TallySpacing.base, 16)
        XCTAssertEqual(TallySpacing.lg, 24)
    }
}
