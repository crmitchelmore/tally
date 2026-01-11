// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "TallyDesignSystem",
    platforms: [
        .iOS(.v17),
        .macOS(.v14)
    ],
    products: [
        .library(
            name: "TallyDesignSystem",
            targets: ["TallyDesignSystem"]
        ),
    ],
    targets: [
        .target(
            name: "TallyDesignSystem",
            dependencies: []
        ),
    ]
)
