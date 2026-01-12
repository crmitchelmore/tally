import Foundation
import PostHog
import Sentry

/// Tally Analytics for iOS
///
/// Provides unified analytics tracking with PostHog and error reporting with Sentry.
/// See docs/ANALYTICS.md for the event taxonomy.
public final class TallyAnalytics: @unchecked Sendable {
  public static let shared = TallyAnalytics()
  
  private var isInitialized = false
  
  private init() {}
  
  // MARK: - Configuration
  
  public struct Config {
    public let posthogApiKey: String?
    public let sentryDsn: String?
    public let environment: String
    public let appVersion: String
    
    public init(
      posthogApiKey: String? = nil,
      sentryDsn: String? = nil,
      environment: String = "production",
      appVersion: String
    ) {
      self.posthogApiKey = posthogApiKey
      self.sentryDsn = sentryDsn
      self.environment = environment
      self.appVersion = appVersion
    }
  }
  
  // MARK: - Initialization
  
  /// Initialize analytics and error tracking
  public func configure(_ config: Config) {
    guard !isInitialized else { return }
    
    // Initialize PostHog
    if let posthogKey = config.posthogApiKey, !posthogKey.isEmpty {
      let posthogConfig = PostHogConfig(apiKey: posthogKey)
      posthogConfig.captureScreenViews = false
      posthogConfig.captureApplicationLifecycleEvents = true
      PostHogSDK.shared.setup(posthogConfig)
      PostHogSDK.shared.register(["platform": "ios", "app_version": config.appVersion])
    }
    
    // Initialize Sentry
    if let sentryDsn = config.sentryDsn, !sentryDsn.isEmpty {
      SentrySDK.start { options in
        options.dsn = sentryDsn
        options.environment = config.environment
        options.releaseName = config.appVersion
        options.tracesSampleRate = 0.1
        options.enableAutoSessionTracking = true
        
        // Privacy: don't capture PII
        options.beforeSend = { event in
          event.user?.email = nil
          event.user?.username = nil
          return event
        }
      }
    }
    
    isInitialized = true
  }
  
  // MARK: - User Identification
  
  /// Identify the current user (ID is hashed for privacy)
  public func identify(userId: String, traits: [String: Any]? = nil) {
    let hashedId = hashUserId(userId)
    PostHogSDK.shared.identify(hashedId, userProperties: traits)
    
    let sentryUser = Sentry.User()
    sentryUser.userId = hashedId
    SentrySDK.setUser(sentryUser)
  }
  
  /// Clear user identity on sign out
  public func reset() {
    PostHogSDK.shared.reset()
    SentrySDK.setUser(nil)
  }
  
  // MARK: - Event Tracking
  
  /// Track an analytics event
  public func track(_ event: String, properties: [String: Any]? = nil) {
    var props = properties ?? [:]
    props["platform"] = "ios"
    
    PostHogSDK.shared.capture(event, properties: props)
  }
  
  // MARK: - Convenience Methods
  
  public func trackEntryCreated(count: Int, hasNote: Bool, hasSets: Bool, hasFeeling: Bool) {
    track("entry_created", properties: [
      "count": count,
      "has_note": hasNote,
      "has_sets": hasSets,
      "has_feeling": hasFeeling
    ])
  }
  
  public func trackChallengeCreated(timeframeUnit: String, targetNumber: Int, isPublic: Bool) {
    track("challenge_created", properties: [
      "timeframe_unit": timeframeUnit,
      "target_number": targetNumber,
      "is_public": isPublic
    ])
  }
  
  public func trackStreakAchieved(streakDays: Int, challengeId: String) {
    track("streak_achieved", properties: [
      "streak_days": streakDays,
      "challenge_id": challengeId
    ])
  }
  
  public func trackChallengeViewed(challengeId: String, isOwn: Bool) {
    track("challenge_viewed", properties: [
      "challenge_id": challengeId,
      "is_own": isOwn
    ])
  }
  
  // MARK: - Error Tracking
  
  /// Capture an error to Sentry
  public func captureError(_ error: Error, context: [String: Any]? = nil) {
    if let context = context {
      SentrySDK.configureScope { scope in
        for (key, value) in context {
          scope.setExtra(value: value, key: key)
        }
      }
    }
    SentrySDK.capture(error: error)
  }
  
  /// Add a breadcrumb for debugging
  public func addBreadcrumb(message: String, category: String? = nil) {
    let crumb = Breadcrumb()
    crumb.message = message
    if let category { crumb.category = category }
    crumb.level = .info
    SentrySDK.addBreadcrumb(crumb)
  }
  
  // MARK: - Private
  
  private func hashUserId(_ userId: String) -> String {
    var hash: UInt64 = 5381
    for char in userId.utf8 {
      hash = ((hash << 5) &+ hash) &+ UInt64(char)
    }
    return "u_\(String(hash, radix: 36))"
  }
}
