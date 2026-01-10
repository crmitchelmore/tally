import Foundation
import LaunchDarkly

/// Service for managing feature flags via LaunchDarkly.
/// Follows the identity strategy from launchdarkly.md:
/// - key: clerkId (authenticated) or anonymous device id
/// - platform: "ios"
/// - env: determined from build configuration
@MainActor
public final class FeatureFlags: ObservableObject, Sendable {
  public static let shared = FeatureFlags()
  
  /// Published flag values for SwiftUI reactivity
  @Published public private(set) var streaksEnabled: Bool = false
  
  private var isInitialized = false
  
  private init() {}
  
  /// Initialize LaunchDarkly with the mobile key.
  /// Call this early in app startup.
  public func initialize(mobileKey: String) {
    guard !mobileKey.isEmpty, !isInitialized else { return }
    
    let config = LDConfig(mobileKey: mobileKey)
    
    // Start with anonymous context
    var builder = LDContextBuilder(key: "anonymous")
    builder.kind("user")
    builder.anonymous(true)
    builder.trySetValue("platform", .string("ios"))
    builder.trySetValue("env", .string(currentEnvironment))
    
    guard case .success(let context) = builder.build() else { return }
    
    LDClient.start(config: config, context: context) { [weak self] in
      Task { @MainActor in
        self?.isInitialized = true
        self?.refreshFlagValues()
        self?.observeFlagChanges()
      }
    }
  }
  
  /// Identify the user after authentication.
  /// - Parameters:
  ///   - clerkId: The Clerk user ID
  ///   - name: Optional user display name
  ///   - email: Optional user email
  public func identify(clerkId: String, name: String? = nil, email: String? = nil) {
    var builder = LDContextBuilder(key: clerkId)
    builder.kind("user")
    builder.anonymous(false)
    builder.trySetValue("platform", .string("ios"))
    builder.trySetValue("env", .string(currentEnvironment))
    
    if let name {
      builder.name(name)
    }
    if let email {
      builder.trySetValue("email", .string(email))
    }
    
    guard case .success(let context) = builder.build() else { return }
    
    LDClient.get()?.identify(context: context, completion: { [weak self] in
      Task { @MainActor in
        self?.refreshFlagValues()
      }
    })
  }
  
  /// Reset to anonymous context (on logout).
  public func resetToAnonymous() {
    var builder = LDContextBuilder(key: "anonymous")
    builder.kind("user")
    builder.anonymous(true)
    builder.trySetValue("platform", .string("ios"))
    builder.trySetValue("env", .string(currentEnvironment))
    
    guard case .success(let context) = builder.build() else { return }
    
    LDClient.get()?.identify(context: context, completion: { [weak self] in
      Task { @MainActor in
        self?.refreshFlagValues()
      }
    })
  }
  
  /// Check if a boolean flag is enabled.
  public func isEnabled(_ flagKey: String, defaultValue: Bool = false) -> Bool {
    LDClient.get()?.boolVariation(forKey: flagKey, defaultValue: defaultValue) ?? defaultValue
  }
  
  /// Get a string flag value.
  public func stringValue(_ flagKey: String, defaultValue: String = "") -> String {
    LDClient.get()?.stringVariation(forKey: flagKey, defaultValue: defaultValue) ?? defaultValue
  }
  
  // MARK: - Private
  
  private var currentEnvironment: String {
    #if DEBUG
    return "dev"
    #else
    return "prod"
    #endif
  }
  
  private func refreshFlagValues() {
    streaksEnabled = isEnabled("streaks-enabled")
  }
  
  private func observeFlagChanges() {
    LDClient.get()?.observe(keys: ["streaks-enabled"], owner: self) { [weak self] _ in
      Task { @MainActor in
        self?.refreshFlagValues()
      }
    }
  }
}
