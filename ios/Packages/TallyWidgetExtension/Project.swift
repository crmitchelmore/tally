import ProjectDescription

let teamId = Environment.developmentTeam.getString(default: "")
let provisioningProfile = Environment.widgetProvisioningProfileSpecifier.getString(default: "")
let codeSignIdentity = Environment.codeSignIdentity.getString(default: "")

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
                    .string("group.app.tally-tracker.shared")
                ])
            ]),
            dependencies: [
                .project(target: "TallyWidgetShared", path: "../TallyWidgetShared"),
                .project(target: "TallyDesign", path: "../TallyDesign")
            ],
            settings: .settings(configurations: [
                .debug(name: "Debug", settings: [
                    "CODE_SIGN_STYLE": "Automatic",
                    "DEVELOPMENT_TEAM": ""
                ]),
                .release(name: "Release", settings: provisioningProfile.isEmpty ? [
                    "CODE_SIGN_STYLE": "Automatic",
                    "DEVELOPMENT_TEAM": .init(stringLiteral: teamId)
                ] : [
                    "CODE_SIGN_STYLE": "Manual",
                    "DEVELOPMENT_TEAM": .init(stringLiteral: teamId),
                    "PROVISIONING_PROFILE_SPECIFIER": .init(stringLiteral: provisioningProfile),
                    "CODE_SIGN_IDENTITY": .init(stringLiteral: codeSignIdentity)
                ])
            ])
        )
    ]
)
