// swift-tools-version: 5.9
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "TallyCore",
    platforms: [
        .iOS(.v16),
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "TallyCore",
            targets: ["Telemetry"]
        ),
    ],
    dependencies: [
        // PostHog analytics
        .package(url: "https://github.com/PostHog/posthog-ios", from: "3.0.0"),
        
        // OpenTelemetry Swift (uncomment when ready to integrate)
        // .package(url: "https://github.com/open-telemetry/opentelemetry-swift", from: "1.9.0"),
    ],
    targets: [
        .target(
            name: "Telemetry",
            dependencies: [
                .product(name: "PostHog", package: "posthog-ios"),
            ],
            path: "Sources/Telemetry"
        ),
        .testTarget(
            name: "TelemetryTests",
            dependencies: ["Telemetry"],
            path: "Tests/TelemetryTests"
        ),
    ]
)
