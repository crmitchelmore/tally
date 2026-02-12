import ProjectDescription

let project = Project(
    name: "TallyShortcuts",
    targets: [
        .target(
            name: "TallyShortcuts",
            destinations: .iOS,
            product: .framework,
            bundleId: "app.tally.shortcuts",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Sources/**"],
            dependencies: [
                .project(target: "TallyFeatureAPIClient", path: "../TallyFeatureAPIClient")
            ],
            settings: .settings(
                base: [
                    "GENERATE_INFOPLIST_FILE": "YES",
                    "SKIP_INSTALL": "YES"
                ]
            )
        ),
        .target(
            name: "TallyShortcutsTests",
            destinations: .iOS,
            product: .unitTests,
            bundleId: "app.tally.shortcuts.tests",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Tests/**"],
            dependencies: [
                .target(name: "TallyShortcuts")
            ]
        )
    ]
)
