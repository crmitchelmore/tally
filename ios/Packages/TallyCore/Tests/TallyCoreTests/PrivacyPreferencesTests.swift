import XCTest
@testable import TallyCore

final class PrivacyPreferencesTests: XCTestCase {
    func testExplicitChoiceAndWithdrawalPersist() {
        let suite = "PrivacyPreferencesTests-\(UUID().uuidString)"
        let defaults = UserDefaults(suiteName: suite)!
        defer { defaults.removePersistentDomain(forName: suite) }
        let preferences = PrivacyPreferences(defaults: defaults)
        XCTAssertFalse(preferences.hasChosen)
        XCTAssertFalse(preferences.analyticsEnabled)
        XCTAssertFalse(preferences.diagnosticsEnabled)
        defaults.set(true, forKey: PrivacyPreferences.analyticsKey)
        XCTAssertFalse(preferences.analyticsEnabled, "A flag alone must not bypass consent")
        preferences.save(analytics: true, diagnostics: false)
        XCTAssertTrue(PrivacyPreferences(defaults: defaults).analyticsEnabled)
        XCTAssertFalse(preferences.diagnosticsEnabled)
        preferences.save(analytics: false, diagnostics: false)
        XCTAssertTrue(preferences.hasChosen)
        XCTAssertFalse(PrivacyPreferences(defaults: defaults).analyticsEnabled)
    }
}
