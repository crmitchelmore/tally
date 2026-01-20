import ProjectDescription

let project = Project(
    name: "TallyCore",
    targets: [
        .target(
            name: "TallyCore",
            destinations: .iOS,
            product: .framework,
            bundleId: "com.tally.core",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Sources/**"],
            dependencies: []
        ),
        .target(
            name: "TallyCoreTests",
            destinations: .iOS,
            product: .unitTests,
            bundleId: "com.tally.core.tests",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Tests/**"],
            dependencies: [
                .target(name: "TallyCore")
            ]
        )
    ]
)
