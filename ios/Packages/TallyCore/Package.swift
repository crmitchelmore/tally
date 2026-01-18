// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "TallyCore",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "TallyCore",
            targets: ["TallyCore"]
        )
    ],
    targets: [
        .target(
            name: "TallyCore"
        ),
        .testTarget(
            name: "TallyCoreTests",
            dependencies: ["TallyCore"],
            path: "Tests/TallyCoreTests"
        )
    ]
)
