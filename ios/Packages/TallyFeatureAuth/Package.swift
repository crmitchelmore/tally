// swift-tools-version: 5.9

import PackageDescription

let package = Package(
    name: "TallyFeatureAuth",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "TallyFeatureAuth",
            targets: ["TallyFeatureAuth"]
        )
    ],
    dependencies: [
        .package(name: "TallyCore", path: "../TallyCore")
    ],
    targets: [
        .target(
            name: "TallyFeatureAuth",
            dependencies: [
                "TallyCore"
            ]
        ),
        .testTarget(
            name: "TallyFeatureAuthTests",
            dependencies: ["TallyFeatureAuth"]
        )
    ]
)
