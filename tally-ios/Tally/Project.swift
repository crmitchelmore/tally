import ProjectDescription

let project = Project(
    name: "Tally",
    organizationName: "Tally Tracker",
    settings: .settings(
        base: [
            "DEVELOPMENT_TEAM": "CHANGEME",
        ],
        configurations: [
            .debug(name: "Debug"),
            .release(name: "Release"),
        ]
    ),
    targets: [
        .target(
            name: "Tally",
            destinations: .iOS,
            product: .app,
            bundleId: "com.tally-tracker.ios",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .extendingDefault(
                with: [
                    "UILaunchScreen": [
                        "UIColorName": "",
                        "UIImageName": "",
                    ],
                    "CFBundleDisplayName": "Tally",
                    "CFBundleShortVersionString": "1.0.0",
                    "CFBundleVersion": "1",
                ]
            ),
            sources: ["Tally/Sources/**"],
            resources: ["Tally/Resources/**"],
            dependencies: [
                .external(name: "Clerk"),
            ]
        ),
        .target(
            name: "TallyTests",
            destinations: .iOS,
            product: .unitTests,
            bundleId: "com.tally-tracker.ios.tests",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Tally/Tests/**"],
            dependencies: [.target(name: "Tally")]
        ),
        .target(
            name: "TallyUITests",
            destinations: .iOS,
            product: .uiTests,
            bundleId: "com.tally-tracker.ios.uitests",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Tally/UITests/**"],
            dependencies: [.target(name: "Tally")]
        ),
    ]
)
