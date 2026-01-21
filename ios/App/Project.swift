import ProjectDescription

// Environment variables passed via Tuist's Environment type or xcconfig
let env = Environment.clerkPublishableKey.getString(default: "")
let apiUrl = Environment.apiBaseURL.getString(default: "https://tally-tracker.app")

let project = Project(
    name: "App",
    targets: [
        .target(
            name: "App",
            destinations: .iOS,
            product: .app,
            bundleId: "com.tally.app",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .extendingDefault(
                with: [
                    "UILaunchScreen": [
                        "UIColorName": "",
                        "UIImageName": "",
                    ],
                    "UISupportedInterfaceOrientations": [
                        "UIInterfaceOrientationPortrait",
                        "UIInterfaceOrientationLandscapeLeft",
                        "UIInterfaceOrientationLandscapeRight"
                    ],
                    "UIApplicationSceneManifest": [
                        "UIApplicationSupportsMultipleScenes": false,
                        "UISceneConfigurations": [:]
                    ],
                    "CLERK_PUBLISHABLE_KEY": "$(CLERK_PUBLISHABLE_KEY)",
                    "API_BASE_URL": "$(API_BASE_URL)"
                ]
            ),
            sources: ["Sources/**"],
            resources: ["Resources/**"],
            dependencies: [
                .project(target: "TallyDesign", path: "../Packages/TallyDesign"),
                .project(target: "TallyCore", path: "../Packages/TallyCore"),
                .project(target: "TallyFeatureAuth", path: "../Packages/TallyFeatureAuth"),
                .project(target: "TallyFeatureAPIClient", path: "../Packages/TallyFeatureAPIClient"),
                .project(target: "TallyFeatureChallenges", path: "../Packages/TallyFeatureChallenges"),
                .external(name: "Clerk")
            ],
            settings: .settings(
                base: [
                    "DEVELOPMENT_TEAM": "",
                    "CODE_SIGN_STYLE": "Automatic",
                    "ENABLE_PREVIEWS": "YES",
                    "CLERK_PUBLISHABLE_KEY": .init(stringLiteral: env),
                    "API_BASE_URL": .init(stringLiteral: apiUrl)
                ],
                configurations: [
                    .debug(name: "Debug"),
                    .release(name: "Release")
                ]
            )
        ),
        .target(
            name: "AppTests",
            destinations: .iOS,
            product: .unitTests,
            bundleId: "com.tally.app.tests",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["Tests/**"],
            dependencies: [
                .target(name: "App")
            ]
        ),
        .target(
            name: "AppUITests",
            destinations: .iOS,
            product: .uiTests,
            bundleId: "com.tally.app.uitests",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["UITests/**"],
            dependencies: [
                .target(name: "App")
            ]
        )
    ]
)
