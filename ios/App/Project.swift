import ProjectDescription

let project = Project(
    name: "Tally",
    organizationName: "Tally",
    options: .options(
        automaticSchemesOptions: .enabled(),
        disableBundleAccessors: false,
        disableSynthesizedResourceAccessors: false
    ),
    packages: [
        .package(path: "../Packages/TallyCore"),
        .package(path: "../Packages/TallyFeatureAuth"),
        .package(path: "../Packages/TallyFeatureAPIClient"),
        .package(path: "../Packages/TallyFeatureChallenges"),
        .package(path: "../Packages/TallyFeatureEntries"),
        .package(path: "../Packages/TallyFeatureEntries"),
        .package(url: "https://github.com/clerk/clerk-ios", from: "0.57.0")
    ],
    settings: .settings(
        configurations: [
            .debug(name: .debug),
            .release(name: .release)
        ]
    ),
    targets: [
        .target(
            name: "TallyApp",
            destinations: .iOS,
            product: .app,
            bundleId: "app.tally",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .file(path: "Sources/Info.plist"),
            sources: ["Sources/**"],
            resources: ["Resources/**"],
            dependencies: [
                .package(product: "TallyCore"),
                .package(product: "TallyFeatureAuth"),
                .package(product: "TallyFeatureAPIClient"),
                .package(product: "TallyFeatureChallenges"),
                .package(product: "TallyFeatureEntries"),
                .package(product: "TallyFeatureEntries"),
                .package(product: "Clerk")
            ],
            settings: .settings(
                base: [
                    "CLERK_PUBLISHABLE_KEY": "$(NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)",
                    "CONVEX_DEPLOYMENT": "$(CONVEX_DEPLOYMENT)",
                    "TELEMETRY_ENVIRONMENT": "$(TELEMETRY_ENVIRONMENT)",
                    "POSTHOG_API_KEY": "$(NEXT_PUBLIC_POSTHOG_KEY)",
                    "POSTHOG_HOST": "$(NEXT_PUBLIC_POSTHOG_HOST)"
                ]
            )
        ),
        .target(
            name: "TallyAppTests",
            destinations: .iOS,
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
            testAction: .targets([]),
            runAction: .runAction(configuration: .debug)
        )
    ]
)
