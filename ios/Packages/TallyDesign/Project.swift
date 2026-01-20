import ProjectDescription

let project = Project(
    name: "TallyDesign",
    targets: [
        .target(
            name: "TallyDesign",
            destinations: .iOS,
            product: .framework,
            bundleId: "com.tally.design",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Sources/**"],
            dependencies: []
        ),
        .target(
            name: "TallyDesignTests",
            destinations: .iOS,
            product: .unitTests,
            bundleId: "com.tally.design.tests",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Tests/**"],
            dependencies: [
                .target(name: "TallyDesign")
            ]
        )
    ]
)
