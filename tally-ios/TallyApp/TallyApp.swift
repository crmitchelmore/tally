import SwiftUI
import TallyCore
import Clerk
import Sentry

@main
struct TallyApp: App {
  @State private var clerk = Clerk.shared
  @StateObject private var featureFlags = FeatureFlags.shared
  @State private var isClerkLoaded = false

  init() {
    // Initialize Sentry
    let sentryDsn = (Bundle.main.object(forInfoDictionaryKey: "SENTRY_DSN") as? String) ?? ""
    if !sentryDsn.isEmpty {
      SentrySDK.start { options in
        options.dsn = sentryDsn
        options.environment = "production"
        
        // Performance monitoring
        options.tracesSampleRate = 0.1
        
        // App hangs detection
        options.enableAppHangTracking = true
        options.appHangTimeoutInterval = 2
        
        // Enable automatic breadcrumbs
        options.enableAutoBreadcrumbTracking = true
        options.enableNetworkBreadcrumbs = true
        
        // Privacy: don't attach screenshots/view hierarchy by default
        options.attachScreenshot = false
        options.attachViewHierarchy = false
        
        // Release tracking
        if let version = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String,
           let build = Bundle.main.infoDictionary?["CFBundleVersion"] as? String {
          options.releaseName = "app.tally.ios@\(version)+\(build)"
        }
      }
    }
  }

  var body: some Scene {
    WindowGroup {
      RootView(isClerkLoaded: isClerkLoaded)
        .environment(\.clerk, clerk)
        .environmentObject(featureFlags)
        .task {
          // Initialize Clerk
          let clerkKey = (Bundle.main.object(forInfoDictionaryKey: "CLERK_PUBLISHABLE_KEY") as? String) ?? ""
          if !clerkKey.isEmpty {
            clerk.configure(publishableKey: clerkKey)
            try? await clerk.load()
          }
          // Mark Clerk as loaded (even if key was empty)
          isClerkLoaded = true
          
          // Initialize LaunchDarkly (fire-and-forget, does not block)
          let ldKey = (Bundle.main.object(forInfoDictionaryKey: "LAUNCHDARKLY_MOBILE_KEY") as? String) ?? ""
          if !ldKey.isEmpty {
            featureFlags.initialize(mobileKey: ldKey)
          }
        }
    }
  }
}
