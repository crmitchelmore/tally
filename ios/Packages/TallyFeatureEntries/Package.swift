// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "TallyFeatureEntries",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "TallyFeatureEntries",
            targets: ["TallyFeatureEntries"]
        )
    ],
    dependencies: [
        .package(name: "TallyCore", path: "../TallyCore"),
        .package(name: "TallyFeatureAPIClient", path: "../TallyFeatureAPIClient")
    ],
    targets: [
        .target(
            name: "TallyFeatureEntries",
            dependencies: [
                "TallyCore",
                "TallyFeatureAPIClient"
            ]
        )
    ]
)
