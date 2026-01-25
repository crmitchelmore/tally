import ProjectDescription

// Default Clerk publishable key (safe to embed - it's public)
// This is the prod Clerk instance (clerk.tally-tracker.app)
let defaultClerkKey = "pk_live_Y2xlcmsudGFsbHktdHJhY2tlci5hcHAk"
let defaultApiUrl = "https://tally-tracker.app"

// Environment variables can override defaults via Tuist's Environment type
let clerkKey = Environment.clerkPublishableKey.getString(default: defaultClerkKey)
let apiUrl = Environment.apiBaseURL.getString(default: defaultApiUrl)

let project = Project(
    name: "App",
    targets: [
        .target(
            name: "App",
            destinations: .iOS,
            product: .app,
            bundleId: "app.tally.ios",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .extendingDefault(
                with: [
                    "CFBundleDisplayName": "Tally",
                    "CFBundleName": "Tally",
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
                .project(target: "TallyFeatureTipJar", path: "../Packages/TallyFeatureTipJar"),
                .external(name: "Clerk")
            ],
            settings: .settings(
                base: [
                    "ENABLE_PREVIEWS": "YES",
                    "CLERK_PUBLISHABLE_KEY": .init(stringLiteral: clerkKey),
                    "API_BASE_URL": .init(stringLiteral: apiUrl)
                ],
                configurations: [
                    .debug(name: "Debug", settings: [
                        "CODE_SIGN_STYLE": "Automatic",
                        "DEVELOPMENT_TEAM": ""
                    ]),
                    .release(name: "Release", settings: [
                        // Allow CI to override with manual signing via xcodebuild args
                        "CODE_SIGN_STYLE": "$(inherited)",
                        "DEVELOPMENT_TEAM": "$(inherited)",
                        "PROVISIONING_PROFILE_SPECIFIER": "$(inherited)",
                        "CODE_SIGN_IDENTITY": "$(inherited)"
                    ])
                ]
            )
        ),
        .target(
            name: "AppTests",
            destinations: .iOS,
            product: .unitTests,
            bundleId: "app.tally.ios.tests",
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
            bundleId: "app.tally.ios.uitests",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .default,
            sources: ["UITests/**"],
            dependencies: [
                .target(name: "App")
            ]
        )
    ]
)
