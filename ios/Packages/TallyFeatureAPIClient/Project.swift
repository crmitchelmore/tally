import ProjectDescription

let project = Project(
    name: "TallyFeatureAPIClient",
    targets: [
        .target(
            name: "TallyFeatureAPIClient",
            destinations: .iOS,
            product: .framework,
            bundleId: "com.tally.feature.apiclient",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Sources/**"],
            dependencies: [
                .project(target: "TallyCore", path: "../TallyCore")
            ]
        ),
        .target(
            name: "TallyFeatureAPIClientTests",
            destinations: .iOS,
            product: .unitTests,
            bundleId: "com.tally.feature.apiclient.tests",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Tests/**"],
            dependencies: [
                .target(name: "TallyFeatureAPIClient")
            ]
        )
    ]
)
