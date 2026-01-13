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
    // Use opentelemetry-swift-core which has minimal dependencies and no DataCompression conflict
    .package(url: "https://github.com/open-telemetry/opentelemetry-swift-core", from: "1.14.0"),
  ],
  targets: [
    .target(
      name: "TallyCore",
      dependencies: [
        .product(name: "LaunchDarkly", package: "ios-client-sdk"),
        .product(name: "Sentry", package: "sentry-cocoa"),
        .product(name: "PostHog", package: "posthog-ios"),
        .product(name: "OpenTelemetryApi", package: "opentelemetry-swift-core"),
        .product(name: "OpenTelemetrySdk", package: "opentelemetry-swift-core"),
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
