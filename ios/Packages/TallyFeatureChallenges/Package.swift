// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "TallyFeatureChallenges",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "TallyFeatureChallenges",
            targets: ["TallyFeatureChallenges"]
        )
    ],
    dependencies: [
        .package(name: "TallyCore", path: "../TallyCore"),
        .package(name: "TallyFeatureAPIClient", path: "../TallyFeatureAPIClient")
    ],
    targets: [
        .target(
            name: "TallyFeatureChallenges",
            dependencies: [
                "TallyCore",
                "TallyFeatureAPIClient"
            ]
        ),
    ]
)
