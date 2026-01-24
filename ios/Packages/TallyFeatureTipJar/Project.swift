import ProjectDescription

let project = Project(
    name: "TallyFeatureTipJar",
    targets: [
        .target(
            name: "TallyFeatureTipJar",
            destinations: .iOS,
            product: .framework,
            bundleId: "com.tally.feature.tipjar",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Sources/**"],
            dependencies: [
                .project(target: "TallyDesign", path: "../TallyDesign")
            ]
        ),
        .target(
            name: "TallyFeatureTipJarTests",
            destinations: .iOS,
            product: .unitTests,
            bundleId: "com.tally.feature.tipjar.tests",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Tests/**"],
            dependencies: [
                .target(name: "TallyFeatureTipJar")
            ]
        )
    ]
)
