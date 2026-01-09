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
  targets: [
    .target(
      name: "TallyCore",
      path: "Sources/TallyCore"
    ),
    .testTarget(
      name: "TallyCoreTests",
      dependencies: ["TallyCore"],
      path: "Tests/TallyCoreTests"
    ),
  ]
)
