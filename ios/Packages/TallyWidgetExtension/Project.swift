import ProjectDescription

let project = Project(
    name: "TallyWidgetExtension",
    targets: [
        .target(
            name: "TallyWidgetExtension",
            destinations: .iOS,
            product: .appExtension,
            bundleId: "app.tally.ios.widget",
            deploymentTargets: .iOS("17.0"),
            infoPlist: .extendingDefault(with: [
                "CFBundleDisplayName": "Tally Widget",
                "NSExtension": [
                    "NSExtensionPointIdentifier": "com.apple.widgetkit-extension"
                ]
            ]),
            sources: ["Sources/**"],
            resources: ["Resources/**"],
            entitlements: .dictionary([
                "com.apple.security.application-groups": .array([
                    .string("group.app.tally.shared")
                ])
            ]),
            dependencies: [
                .project(target: "TallyWidgetShared", path: "../TallyWidgetShared"),
                .project(target: "TallyDesign", path: "../TallyDesign")
            ]
        )
    ]
)
