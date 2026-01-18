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
        .package(name: "TallyCore", path: "../TallyCore"),
        .package(url: "https://github.com/clerk/clerk-ios", from: "0.57.0")
    ],
    targets: [
        .target(
            name: "TallyFeatureAuth",
            dependencies: [
                "TallyCore",
                .product(name: "Clerk", package: "clerk-ios")
            ]
        ),
        .testTarget(
            name: "TallyFeatureAuthTests",
            dependencies: ["TallyFeatureAuth"],
            path: "Tests/TallyFeatureAuthTests"
        )
    ]
)
