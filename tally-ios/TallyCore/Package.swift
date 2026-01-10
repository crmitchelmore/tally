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
  ],
  targets: [
    .target(
      name: "TallyCore",
      dependencies: [
        .product(name: "LaunchDarkly", package: "ios-client-sdk"),
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
