import ProjectDescription

let project = Project(
    name: "TallyFeatureChallenges",
    targets: [
        .target(
            name: "TallyFeatureChallenges",
            destinations: .iOS,
            product: .framework,
            bundleId: "com.tally.feature.challenges",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Sources/**"],
            dependencies: [
                .project(target: "TallyCore", path: "../TallyCore"),
                .project(target: "TallyDesign", path: "../TallyDesign"),
                .project(target: "TallyFeatureAPIClient", path: "../TallyFeatureAPIClient"),
                .project(target: "TallyFeatureAuth", path: "../TallyFeatureAuth")
            ]
        ),
        .target(
            name: "TallyFeatureChallengesTests",
            destinations: .iOS,
            product: .unitTests,
            bundleId: "com.tally.feature.challenges.tests",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Tests/**"],
            dependencies: [
                .target(name: "TallyFeatureChallenges")
            ]
        )
    ]
)
