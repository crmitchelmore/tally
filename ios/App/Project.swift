import ProjectDescription

let project = Project(
    name: "Tally",
    organizationName: "Tally",
    options: .options(
        automaticSchemesOptions: .enabled(),
        disableBundleAccessors: false,
        disableSynthesizedResourceAccessors: false
    ),
    settings: .settings(
        configurations: [
            .debug(name: .debug),
            .release(name: .release)
        ]
    ),
    targets: [
        .target(
            name: "TallyApp",
            platform: .iOS,
            product: .app,
            bundleId: "app.tally",
            deploymentTarget: .iOS(targetVersion: "17.0", devices: [.iphone]),
            infoPlist: .extendingDefault(
                with: [
                    "UILaunchScreen": [:],
                    "UISupportedInterfaceOrientations": ["UIInterfaceOrientationPortrait"],
                    "UIApplicationSceneManifest": [
                        "UIApplicationSupportsMultipleScenes": false
                    ]
                ]
            ),
            sources: ["Sources/**"],
            resources: ["Resources/**"],
            dependencies: [
                .project(target: "TallyCore", path: "../Packages/TallyCore"),
                .project(target: "TallyFeatureAuth", path: "../Packages/TallyFeatureAuth")
            ]
        ),
        .target(
            name: "TallyAppTests",
            platform: .iOS,
            product: .unitTests,
            bundleId: "app.tally.tests",
            infoPlist: .default,
            sources: ["Tests/**"],
            dependencies: [
                .target(name: "TallyApp")
            ]
        )
    ],
    schemes: [
        .scheme(
            name: "Tally",
            shared: true,
            buildAction: .buildAction(targets: ["TallyApp"]),
            testAction: .targets(["TallyAppTests"]),
            runAction: .runAction(configuration: .debug)
        )
    ]
)
