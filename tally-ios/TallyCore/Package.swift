// swift-tools-version: 6.0

import PackageDescription

let package = Package(
  name: "TallyCore",
  platforms: [
    .iOS(.v16),
    .macOS(.v13)
  ],
  products: [
    .library(name: "TallyCore", targets: ["TallyCore"]),
  ],
  dependencies: [
    .package(url: "https://github.com/launchdarkly/ios-client-sdk", from: "9.0.0"),
    .package(url: "https://github.com/getsentry/sentry-cocoa", from: "8.0.0"),
    .package(url: "https://github.com/PostHog/posthog-ios", from: "3.0.0"),
    // Use Datadog's API-only fork to avoid DataCompression conflict with PostHog/LaunchDarkly
    .package(url: "https://github.com/DataDog/opentelemetry-swift-packages", from: "1.6.0"),
  ],
  targets: [
    .target(
      name: "TallyCore",
      dependencies: [
        .product(name: "LaunchDarkly", package: "ios-client-sdk"),
        .product(name: "Sentry", package: "sentry-cocoa"),
        .product(name: "PostHog", package: "posthog-ios"),
        // Only API and SDK - no conflicting transitive dependencies
        .product(name: "OpenTelemetryApi", package: "opentelemetry-swift-packages"),
        .product(name: "OpenTelemetrySdk", package: "opentelemetry-swift-packages"),
      ],
      path: "Sources/TallyCore"
    ),
    .testTarget(
      name: "TallyCoreTests",
      dependencies: ["TallyCore"],
      path: "Tests/TallyCoreTests"
    ),
  ]
)
