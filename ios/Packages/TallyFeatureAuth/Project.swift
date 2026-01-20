import ProjectDescription

let project = Project(
    name: "TallyFeatureAuth",
    targets: [
        .target(
            name: "TallyFeatureAuth",
            destinations: .iOS,
            product: .framework,
            bundleId: "com.tally.feature.auth",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Sources/**"],
            dependencies: [
                .project(target: "TallyCore", path: "../TallyCore"),
                .project(target: "TallyDesign", path: "../TallyDesign"),
                .external(name: "Clerk")
            ]
        ),
        .target(
            name: "TallyFeatureAuthTests",
            destinations: .iOS,
            product: .unitTests,
            bundleId: "com.tally.feature.auth.tests",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Tests/**"],
            dependencies: [
                .target(name: "TallyFeatureAuth")
            ]
        )
    ]
)
