import ProjectDescription

let project = Project(
    name: "TallyWidgetShared",
    targets: [
        .target(
            name: "TallyWidgetShared",
            destinations: .iOS,
            product: .framework,
            bundleId: "app.tally.widget.shared",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Sources/**"],
            dependencies: []
        ),
        .target(
            name: "TallyWidgetSharedTests",
            destinations: .iOS,
            product: .unitTests,
            bundleId: "app.tally.widget.shared.tests",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Tests/**"],
            dependencies: [
                .target(name: "TallyWidgetShared")
            ]
        )
    ]
)
