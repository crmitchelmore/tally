// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "TallyFeatureAPIClient",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v17),
        .macOS(.v12)
    ],
    products: [
        .library(
            name: "TallyFeatureAPIClient",
            targets: ["TallyFeatureAPIClient"]
        )
    ],
    dependencies: [
        .package(name: "TallyCore", path: "../TallyCore")
    ],
    targets: [
        .target(
            name: "TallyFeatureAPIClient",
            dependencies: [
                "TallyCore"
            ]
        ),
        .testTarget(
            name: "TallyFeatureAPIClientTests",
            dependencies: ["TallyFeatureAPIClient"],
            path: "Tests/TallyFeatureAPIClientTests"
        )
    ]
)
