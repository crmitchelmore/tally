import ProjectDescription

let project = Project(
    name: "TallyLiveActivity",
    targets: [
        .target(
            name: "TallyLiveActivity",
            destinations: .iOS,
            product: .framework,
            bundleId: "app.tally.liveactivity",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Sources/**"],
            dependencies: [
                .project(target: "TallyDesign", path: "../TallyDesign")
            ]
        ),
        .target(
            name: "TallyLiveActivityTests",
            destinations: .iOS,
            product: .unitTests,
            bundleId: "app.tally.liveactivity.tests",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Tests/**"],
            dependencies: [
                .target(name: "TallyLiveActivity")
            ]
        )
    ]
)
