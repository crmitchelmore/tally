// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "TallyFeatureChallenges",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v17),
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "TallyFeatureChallenges",
            targets: ["TallyFeatureChallenges"]
        )
    ],
    dependencies: [
        .package(name: "TallyCore", path: "../TallyCore"),
        .package(name: "TallyFeatureAPIClient", path: "../TallyFeatureAPIClient"),
        .package(name: "TallyFeatureEntries", path: "../TallyFeatureEntries")
    ],
    targets: [
        .target(
            name: "TallyFeatureChallenges",
            dependencies: [
                "TallyCore",
                "TallyFeatureAPIClient",
                "TallyFeatureEntries"
            ]
        ),
    ]
)
